CREATE OR REPLACE FUNCTION public.is_partner_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'partner_member' AND is_active = true);
END;
$$ LANGUAGE plpgsql STABLE;

INSERT INTO public.profiles (id, email, full_name, partner_id, role, partner_type, access_level, permissions, is_first_login, is_active)
VALUES (
  'PARTNER-USER-UUID',
  'partner.user@example.com',
  'Partner User',
  'PARTNER-ID',
  'partner_member',
  'media',
  25,
  jsonb_build_array(
    jsonb_build_object('category', 'dashboard', 'level', 'view'),
    jsonb_build_object('category', 'campaigns', 'level', 'view'),
    jsonb_build_object('category', 'programs', 'level', 'view'),
    jsonb_build_object('category', 'tasks', 'level', 'view'),
    jsonb_build_object('category', 'settings', 'level', 'view'),
    jsonb_build_object('category', 'users', 'level', 'view'),
    jsonb_build_object('category', 'wallet', 'level', 'view')
  ),
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  role = 'partner_member',
  access_level = 25,
  permissions = jsonb_build_array(
    jsonb_build_object('category', 'dashboard', 'level', 'view'),
    jsonb_build_object('category', 'campaigns', 'level', 'view'),
    jsonb_build_object('category', 'programs', 'level', 'view'),
    jsonb_build_object('category', 'tasks', 'level', 'view'),
    jsonb_build_object('category', 'settings', 'level', 'view'),
    jsonb_build_object('category', 'users', 'level', 'view'),
    jsonb_build_object('category', 'wallet', 'level', 'view')
  ),
  is_active = true;

INSERT INTO public.wallets (partner_id, user_id, balance, total_earnings, pending_withdrawals, payment_method, is_active)
VALUES ('PARTNER-ID', 'PARTNER-USER-UUID', 0.00, 0.00, 0.00, 'mpesa', true)
ON CONFLICT (partner_id, user_id) DO NOTHING;

SELECT p.id, p.email, p.role, p.partner_id, jsonb_array_length(p.permissions) as perm_count
FROM public.profiles p WHERE p.id = 'PARTNER-USER-UUID';
