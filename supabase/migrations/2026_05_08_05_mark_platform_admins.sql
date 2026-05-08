-- Set is_platform_admin from the legacy role column. profiles.role still exists
-- after this and stays populated until PR C drops it.

UPDATE public.profiles
SET is_platform_admin = true
WHERE role = 'admin';
