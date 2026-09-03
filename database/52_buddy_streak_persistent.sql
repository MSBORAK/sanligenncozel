-- İKİLİ ZİNCİR (buddy streak) ARTIK KALICI DEĞİLDİ
-- buddy_mutual_snap_streak() fonksiyonu her seferinde ham social_posts
-- satırlarını geriye doğru tarayarak "hangi günler ikisi de attı" diye
-- sayıyordu. Az önce eklediğimiz otomatik silme cron'u (48 numaralı
-- migration) social_posts satırlarını 4 saatte kalıcı olarak sildiği için,
-- bu tarama artık hiçbir zaman "bugün"den öteye geçemiyor — zincir asla
-- ilerleyemez. Kişisel streak (snap_streak_current) zaten ayrı, kalıcı bir
-- sayaçla tutuluyordu (refresh_snap_streak) ve bu sorundan etkilenmiyordu;
-- ikili zincir için de aynı deseni uyguluyoruz.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS buddy_streak_current INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buddy_streak_best INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buddy_streak_last_local_date DATE,
ADD COLUMN IF NOT EXISTS buddy_streak_partner_id UUID;

CREATE OR REPLACE FUNCTION refresh_buddy_streak(p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := ((now() AT TIME ZONE 'Europe/Istanbul'))::date;
  v_buddy uuid;
  v_both_posted_today boolean;
  v_last date;
  v_curr int;
  v_best int;
  v_partner uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT streak_buddy_user_id INTO v_buddy FROM user_profiles WHERE user_id = p_user_id;
  IF v_buddy IS NULL THEN
    RETURN json_build_object('current', 0, 'best', 0);
  END IF;

  v_both_posted_today :=
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE user_id = p_user_id AND image_url IS NOT NULL AND image_url <> ''
        AND ((created_at AT TIME ZONE 'Europe/Istanbul')::date) = v_today
    )
    AND EXISTS (
      SELECT 1 FROM social_posts
      WHERE user_id = v_buddy AND image_url IS NOT NULL AND image_url <> ''
        AND ((created_at AT TIME ZONE 'Europe/Istanbul')::date) = v_today
    );

  IF NOT v_both_posted_today THEN
    SELECT buddy_streak_current, buddy_streak_best
    INTO v_curr, v_best
    FROM user_profiles WHERE user_id = p_user_id;
    RETURN json_build_object('current', COALESCE(v_curr, 0), 'best', COALESCE(v_best, 0));
  END IF;

  SELECT buddy_streak_last_local_date, buddy_streak_current, buddy_streak_best, buddy_streak_partner_id
  INTO v_last, v_curr, v_best, v_partner
  FROM user_profiles WHERE user_id = p_user_id;

  -- Zincir bugün zaten sayıldıysa ya da buddy değiştiyse baştan başlat
  IF v_last = v_today AND v_partner = v_buddy THEN
    RETURN json_build_object('current', COALESCE(v_curr, 0), 'best', COALESCE(v_best, 0));
  ELSIF v_last = v_today - 1 AND v_partner = v_buddy THEN
    v_curr := COALESCE(v_curr, 0) + 1;
  ELSE
    v_curr := 1;
  END IF;

  v_best := GREATEST(COALESCE(v_best, 0), v_curr);

  -- Her iki tarafın da satırını güncelle: zincir mutual bir kavram, ikisi de aynı sayıyı görmeli
  UPDATE user_profiles SET
    buddy_streak_current = v_curr,
    buddy_streak_best = v_best,
    buddy_streak_last_local_date = v_today,
    buddy_streak_partner_id = v_buddy
  WHERE user_id = p_user_id;

  UPDATE user_profiles SET
    buddy_streak_current = v_curr,
    buddy_streak_best = GREATEST(COALESCE(buddy_streak_best, 0), v_curr),
    buddy_streak_last_local_date = v_today,
    buddy_streak_partner_id = p_user_id
  WHERE user_id = v_buddy AND streak_buddy_user_id = p_user_id;

  RETURN json_build_object('current', v_curr, 'best', v_best);
END;
$$;

REVOKE ALL ON FUNCTION refresh_buddy_streak(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_buddy_streak(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
