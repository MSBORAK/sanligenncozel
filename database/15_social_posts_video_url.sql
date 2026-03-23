-- Kıvılcım videoları (video_url). Supabase SQL Editor'da çalıştırın.
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN social_posts.video_url IS 'Anlık video kıvılcımı; doluysa image_url boş olabilir.';

-- İkili streak: foto veya video sayılır
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
        AND ((created_at AT TIME ZONE 'Europe/Istanbul')::date) = v_day
        AND (
          (image_url IS NOT NULL AND image_url <> '')
          OR (video_url IS NOT NULL AND video_url <> '')
        )
    ) AND EXISTS (
      SELECT 1 FROM social_posts
      WHERE user_id = p_b
        AND ((created_at AT TIME ZONE 'Europe/Istanbul')::date) = v_day
        AND (
          (image_url IS NOT NULL AND image_url <> '')
          OR (video_url IS NOT NULL AND video_url <> '')
        )
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

NOTIFY pgrst, 'reload schema';
