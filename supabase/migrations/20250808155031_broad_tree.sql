/*
  # Create Authentication Users

  1. User Creation
    - Create admin, clerk, and sarvodaya users
    - Set up proper authentication with encrypted passwords
    - Configure user metadata for roles

  2. Security
    - Use Supabase auth system
    - Encrypted passwords
    - Role-based metadata
*/

-- Insert admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@sarvodayaschool.edu',
  crypt('admin', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "admin", "role": "admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert clerk user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'clerk@sarvodayaschool.edu',
  crypt('admin', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "clerk", "role": "clerk"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert sarvodaya user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sarvodaya@sarvodayaschool.edu',
  crypt('admin', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "sarvodaya", "role": "sarvodaya"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create teacher users for all classes
DO $$
DECLARE
  class_num integer;
  division_letter text;
  teacher_email text;
  teacher_username text;
BEGIN
  FOR class_num IN 1..12 LOOP
    FOR division_letter IN SELECT unnest(ARRAY['a', 'b', 'c', 'd', 'e']) LOOP
      teacher_username := 'class' || class_num || division_letter;
      teacher_email := teacher_username || '@sarvodayaschool.edu';
      
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        teacher_email,
        crypt('admin', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
          'username', teacher_username,
          'role', 'teacher',
          'class', class_num::text,
          'division', upper(division_letter)
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
      ) ON CONFLICT (email) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;