-- Seed Migration: Sample Data Population
-- Creates 3 users, 3 projects with standard stages, and 10 tasks per project
-- Note: This migration uses direct SQL inserts which bypass RLS; use only for development/testing

BEGIN;

-- Step 1: Create test users via Supabase Auth admin API is not available here,
-- so we'll insert projects and stages with fixed UUIDs for demo purposes.
-- In production, use Supabase Auth dashboard or API to create users first.

-- For this seed, we'll use these sample user IDs (simulated):
-- nik: 550e8400-e29b-41d4-a716-446655440001
-- maria: 550e8400-e29b-41d4-a716-446655440002
-- peter: 550e8400-e29b-41d4-a716-446655440003

-- Step 2: Insert Projects
INSERT INTO public.projects (id, owner_id, title, description, created_at, updated_at)
VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'nik''s Project', 'Sample project for nik@gmail.com', now(), now()),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'maria''s Project', 'Sample project for maria@gmail.com', now(), now()),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'peter''s Project', 'Sample project for peter@gmail.com', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert Standard Stages for each project
-- Project 1 - nik
INSERT INTO public.project_stages (id, project_id, title, position, created_at, updated_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Not Started', 1, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'In Progress', 2, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Done', 3, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Project 2 - maria
INSERT INTO public.project_stages (id, project_id, title, position, created_at, updated_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Not Started', 1, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'In Progress', 2, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', 'Done', 3, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Project 3 - peter
INSERT INTO public.project_stages (id, project_id, title, position, created_at, updated_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440003', 'Not Started', 1, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440003', 'In Progress', 2, now(), now()),
  ('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440003', 'Done', 3, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Step 4: Insert 10 Tasks per Project
-- Tasks for Project 1 (nik) - Distribution: 3 Not Started, 4 In Progress, 3 Done
INSERT INTO public.tasks (id, project_id, stage_id, title, description_html, position, done, created_at, updated_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Setup project structure', '<p>Initialize folder and file structure</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Create database schema', '<p>Design and implement database tables</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Implement authentication', '<p>Setup user signup and login flow</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Build dashboard UI', '<p>Create responsive dashboard layout</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Add task management features', '<p>Implement create, edit, delete tasks</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Implement drag and drop', '<p>Add task reordering within stages</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Create REST API endpoints', '<p>Build API for all CRUD operations</p>', 4, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'Add form validation', '<p>Client and server-side validation</p>', 1, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'Setup error handling', '<p>Global error handling and UI feedback</p>', 2, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'Deploy to production', '<p>Deploy app to Netlify</p>', 3, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Tasks for Project 2 (maria)
INSERT INTO public.tasks (id, project_id, stage_id, title, description_html, position, done, created_at, updated_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', 'Setup project structure', '<p>Initialize folder and file structure</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', 'Create database schema', '<p>Design and implement database tables</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', 'Implement authentication', '<p>Setup user signup and login flow</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'Build dashboard UI', '<p>Create responsive dashboard layout</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'Add task management features', '<p>Implement create, edit, delete tasks</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'Implement drag and drop', '<p>Add task reordering within stages</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'Create REST API endpoints', '<p>Build API for all CRUD operations</p>', 4, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', 'Add form validation', '<p>Client and server-side validation</p>', 1, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', 'Setup error handling', '<p>Global error handling and UI feedback</p>', 2, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', 'Deploy to production', '<p>Deploy app to Netlify</p>', 3, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Tasks for Project 3 (peter)
INSERT INTO public.tasks (id, project_id, stage_id, title, description_html, position, done, created_at, updated_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007', 'Setup project structure', '<p>Initialize folder and file structure</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007', 'Create database schema', '<p>Design and implement database tables</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007', 'Implement authentication', '<p>Setup user signup and login flow</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440008', 'Build dashboard UI', '<p>Create responsive dashboard layout</p>', 1, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440008', 'Add task management features', '<p>Implement create, edit, delete tasks</p>', 2, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440008', 'Implement drag and drop', '<p>Add task reordering within stages</p>', 3, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440008', 'Create REST API endpoints', '<p>Build API for all CRUD operations</p>', 4, false, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440028', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440009', 'Add form validation', '<p>Client and server-side validation</p>', 1, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440029', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440009', 'Setup error handling', '<p>Global error handling and UI feedback</p>', 2, true, now(), now()),
  ('880e8400-e29b-41d4-a716-446655440030', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440009', 'Deploy to production', '<p>Deploy app to Netlify</p>', 3, true, now(), now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
