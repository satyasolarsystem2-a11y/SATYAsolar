ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (
  'admin',
  'sales',
  'registration',
  'finance',
  'project',
  'warehouse',
  'net_metering',
  'quality',
  'subsidy',
  'customer_service',
  'banking',
  'accounts',
  'inventory',
  'procurement',
  'field_installation',
  'electrical',
  'technical',
  'operations'
));
