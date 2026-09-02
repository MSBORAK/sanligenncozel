-- Streak (günlük kıvılcım zinciri) + Grup kıvılcımı (recipient_user_ids)
-- Supabase SQL Editor'da TEK SEFERDE çalıştırın.
--
-- "Could not find ... streak_buddy_user_id ... schema cache" görürseniz:
--  1) Bu dosyayı çalıştırdığınızdan emin olun (özellikle satır 9).
--  2) Aşağıdaki NOTIFY ile PostgREST şema önbelleğini yenileyin (aynı editörde).
--  3) Olmazsa Dashboard → Project Settings → API → "Restart" / birkaç dakika bekleyin.

-- ─── user_profiles: kişisel streak + isteğe bağlı zincir arkadaşı ───────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS snap_streak_current INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS snap_streak_best INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS snap_streak_last_local_date DATE;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_buddy_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── social_posts: sadece seçilen arkadaşlara görünür kıvılcım (2–5 kişi) ─
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS recipient_user_ids UUID[];

COMMENT ON COLUMN social_posts.recipient_user_ids IS 'NULL veya boş: tüm arkadaşlara açık (eski davranış). Dolu: yalnızca bu user_id''ler + gönderen görür.';

CREATE INDEX IF NOT EXISTS idx_social_posts_recipient_gin ON social_posts USING GIN (recipient_user_ids);

-- ─── Kişisel streak: her başarılı kıvılcımdan sonra client çağırır ───────────
CREATE OR REPLACE FUNCTION public.refresh_snap_streak(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := ((now() AT TIME ZONE 'Europe/Istanbul'))::date;
  v_last date;
  v_curr int;
  v_best int;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT snap_streak_last_local_date, snap_streak_current, snap_streak_best
  INTO v_last, v_curr, v_best
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  IF v_last IS NULL THEN
    v_curr := 1;
  ELSIF v_last = v_today THEN
    RETURN json_build_object(
      'current', COALESCE(v_curr, 0),
      'best', GREATEST(COALESCE(v_best, 0), COALESCE(v_curr, 0))
    );
  ELSIF v_last = v_today - 1 THEN
    v_curr := COALESCE(v_curr, 0) + 1;
  ELSE
    v_curr := 1;
  END IF;

  v_best := GREATEST(COALESCE(v_best, 0), v_curr);

  UPDATE user_profiles SET
    snap_streak_current = v_curr,
    snap_streak_best = v_best,
    snap_streak_last_local_date = v_today
  WHERE user_id = p_user_id;

  RETURN json_build_object('current', v_curr, 'best', v_best);
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_snap_streak(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_snap_streak(uuid) TO authenticated;

-- ─── İkili zincir: iki kullanıcının aynı İstanbul takvim gününde kıvılcımı ─
CREATE OR REPLACE FUNCTION public.buddy_mutual_snap_streak(p_a uuid, p_b uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day date;
  v_count int := 0;
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() IS DISTINCT FROM p_a AND auth.uid() IS DISTINCT FROM p_b) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  v_day := ((now() AT TIME ZONE 'Europe/Istanbul'))::date;

  WHILE v_count < 400 LOOP
    IF EXISTS (
      SELECT 1 FROM social_posts
      WHERE user_id = p_a
        AND image_url IS NOT NULL AND image_url <> ''
        AND ((created_at AT TIME ZONE 'Europe/Istanbul')::date) = v_day
    ) AND EXISTS (
      SELECT 1 FROM social_posts
      WHERE user_id = p_b
        AND image_url IS NOT NULL AND image_url <> ''
        AND ((created_at AT TIME ZONE 'Europe/Istanbul')::date) = v_day
    ) THEN
      v_count := v_count + 1;
      v_day := v_day - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.buddy_mutual_snap_streak(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buddy_mutual_snap_streak(uuid, uuid) TO authenticated;

-- PostgREST şema önbelleğini yenile (kolon eklendikten hemen sonra API'nin görmesi için)
NOTIFY pgrst, 'reload schema';
