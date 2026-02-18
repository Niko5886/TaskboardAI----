-- Migration: Add Mobile App Development Project
-- Adds a new project for mobile app development with relevant tasks
-- Date: 2026-02-18

BEGIN;

-- Insert Mobile App Development Project
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
-- Run this query first to get your user ID: SELECT id, email FROM auth.users LIMIT 1;
INSERT INTO public.projects (id, owner_id, title, description, created_at, updated_at)
VALUES
  ('660e8400-e29b-41d4-a716-446655440004', 
   (SELECT id FROM auth.users WHERE email = 'nik@gmail.com' LIMIT 1), -- Change email if needed
   'Mobile App Development', 
   'Cross-platform mobile application development project', 
   now(), 
   now())
ON CONFLICT (id) DO NOTHING;

-- Insert Standard Stages for Mobile App Development project
INSERT INTO public.project_stages (id, project_id, title, position, created_at, updated_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440004', 'Backlog', 1, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440004', 'In Development', 2, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440004', 'Testing', 3, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440004', 'Completed', 4, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert Tasks for Mobile App Development Project
-- Distribution: 4 Backlog, 5 In Development, 3 Testing, 3 Completed

-- Backlog Tasks (4)
INSERT INTO public.tasks (id, project_id, stage_id, title, description_html, position, done, created_at, updated_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440010', 'Setup React Native environment', '<p>Install Node.js, React Native CLI, Android Studio, and Xcode</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440032', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440010', 'Design app architecture', '<p>Plan folder structure, state management, and navigation flow</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440033', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440010', 'Create wireframes and mockups', '<p>Design UI/UX mockups in Figma for all screens</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440034', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440010', 'Setup CI/CD pipeline', '<p>Configure GitHub Actions for automated builds and deployments</p>', 4, false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- In Development Tasks (5)
INSERT INTO public.tasks (id, project_id, stage_id, title, description_html, position, done, created_at, updated_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440035', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440011', 'Implement authentication flow', '<p>Build login, signup, password reset with Firebase Auth</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440036', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440011', 'Create navigation system', '<p>Setup React Navigation with tab and stack navigators</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440037', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440011', 'Build home screen UI', '<p>Create responsive home screen with dashboard components</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440038', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440011', 'Integrate REST API', '<p>Connect to backend API endpoints for data fetching</p>', 4, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440039', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440011', 'Implement push notifications', '<p>Setup Firebase Cloud Messaging for notifications</p>', 5, false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Testing Tasks (3)
INSERT INTO public.tasks (id, project_id, stage_id, title, description_html, position, done, created_at, updated_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440040', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440012', 'Test on Android devices', '<p>Test app functionality on various Android devices and versions</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440041', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440012', 'Test on iOS devices', '<p>Test app functionality on iPhone and iPad with different iOS versions</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440042', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440012', 'Performance optimization', '<p>Profile app performance, reduce bundle size, optimize images</p>', 3, false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Completed Tasks (3)
INSERT INTO public.tasks (id, project_id, stage_id, title, description_html, position, done, created_at, updated_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440043', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440013', 'Setup project repository', '<p>Initialize Git repository and configure .gitignore</p>', 1, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440044', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440013', 'Install dependencies', '<p>Install React Native, React Navigation, and other required packages</p>', 2, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440045', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440013', 'Configure ESLint and Prettier', '<p>Setup code formatting and linting rules for the project</p>', 3, true, now(), now())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Summary:
-- - 1 new project: Mobile App Development
-- - 4 stages: Backlog, In Development, Testing, Completed
-- - 15 tasks total (4 backlog, 5 in development, 3 testing, 3 completed)
