/**
 * Mobile App Development Project Seed Script
 * ============================================
 * Seeds a Mobile App Development project with:
 * - 1 project: "Mobile App Development"
 * - 4 stages: Backlog, In Development, Testing, Completed
 * - 15 tasks distributed across stages
 *
 * Usage: node db/seed-mobile-app.js
 */

import https from 'https';
import { URL } from 'url';

// Configuration
const SUPABASE_URL = 'https://gctubqqiyvetzqidjxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdHVicXFpeXZldHpxaWRqeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODIwOTEsImV4cCI6MjA4NjU1ODA5MX0.1CaZYpLwBzItBIHKdfsL3fQ9wS5DVMWyLA69UUV-5pg';

// Mobile App stages
const MOBILE_APP_STAGES = [
  { title: 'Backlog', position: 1 },
  { title: 'In Development', position: 2 },
  { title: 'Testing', position: 3 },
  { title: 'Completed', position: 4 }
];

// Mobile App task templates (15 tasks)
const MOBILE_APP_TASK_TEMPLATES = [
  // Backlog (4 tasks)
  { title: 'Setup React Native environment', description: '<p>Install Node.js, React Native CLI, Android Studio, and Xcode</p>', stage: 0 },
  { title: 'Design app architecture', description: '<p>Plan folder structure, state management, and navigation flow</p>', stage: 0 },
  { title: 'Create wireframes and mockups', description: '<p>Design UI/UX mockups in Figma for all screens</p>', stage: 0 },
  { title: 'Setup CI/CD pipeline', description: '<p>Configure GitHub Actions for automated builds and deployments</p>', stage: 0 },
  
  // In Development (5 tasks)
  { title: 'Implement authentication flow', description: '<p>Build login, signup, password reset with Firebase Auth</p>', stage: 1 },
  { title: 'Create navigation system', description: '<p>Setup React Navigation with tab and stack navigators</p>', stage: 1 },
  { title: 'Build home screen UI', description: '<p>Create responsive home screen with dashboard components</p>', stage: 1 },
  { title: 'Integrate REST API', description: '<p>Connect to backend API endpoints for data fetching</p>', stage: 1 },
  { title: 'Implement push notifications', description: '<p>Setup Firebase Cloud Messaging for notifications</p>', stage: 1 },
  
  // Testing (3 tasks)
  { title: 'Test on Android devices', description: '<p>Test app functionality on various Android devices and versions</p>', stage: 2 },
  { title: 'Test on iOS devices', description: '<p>Test app functionality on iPhone and iPad with different iOS versions</p>', stage: 2 },
  { title: 'Performance optimization', description: '<p>Profile app performance, reduce bundle size, optimize images</p>', stage: 2 },
  
  // Completed (3 tasks)
  { title: 'Setup project repository', description: '<p>Initialize Git repository and configure .gitignore</p>', stage: 3 },
  { title: 'Install dependencies', description: '<p>Install React Native, React Navigation, and other required packages</p>', stage: 3 },
  { title: 'Configure ESLint and Prettier', description: '<p>Setup code formatting and linting rules for the project</p>', stage: 3 }
];

/**
 * Helper function to make HTTPS requests to Supabase
 */
function supabaseRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Main seed function for Mobile App Development project
 */
async function seedMobileAppProject() {
  console.log('📱 Seeding Mobile App Development Project...\n');

  try {
    // Step 1: Get current authenticated user
    console.log('👤 Step 1: Getting current user...');
    // For this demo, we'll need a user ID. You should be logged in.
    // We'll try to use the first user from the database
    const usersRes = await supabaseRequest('GET', '/rest/v1/rpc/get_current_user_id');
    let userId = usersRes;

    // If no user found, use a default UUID (you'll need to replace this with actual user)
    if (!userId) {
      userId = '550e8400-e29b-41d4-a716-446655440001'; // Default to nik's user ID
      console.log('  ⚠️  Using default user ID (nik)');
    } else {
      console.log('  ✓ User found');
    }

    // Step 2: Create Mobile App Development project
    console.log('\n📊 Step 2: Creating Mobile App Development project...');
    const projectRes = await supabaseRequest('POST', '/rest/v1/projects', {
      title: 'Mobile App Development',
      owner_id: userId,
      description: 'Cross-platform mobile application development project'
    });

    const projectId = projectRes[0]?.id;
    console.log(`  ✓ Project created: Mobile App Development (ID: ${projectId})`);

    // Step 3: Create stages for this project
    console.log('\n🎯 Step 3: Creating stages...');
    const stagesForProject = [];
    for (const stage of MOBILE_APP_STAGES) {
      const stageRes = await supabaseRequest('POST', '/rest/v1/project_stages', {
        project_id: projectId,
        title: stage.title,
        position: stage.position
      });
      const stageId = stageRes[0]?.id;
      stagesForProject.push({ ...stage, id: stageId });
      console.log(`  ✓ Stage created: ${stage.title}`);
    }

    // Step 4: Create tasks distributed across stages
    console.log('\n✅ Step 4: Creating 15 tasks...');
    let taskCounter = 0;
    for (const taskTemplate of MOBILE_APP_TASK_TEMPLATES) {
      const stageIndex = taskTemplate.stage;
      const stage = stagesForProject[stageIndex];
      const isDone = stageIndex === 3; // Mark Completed stage tasks as done

      const taskRes = await supabaseRequest('POST', '/rest/v1/tasks', {
        project_id: projectId,
        stage_id: stage.id,
        title: taskTemplate.title,
        description_html: taskTemplate.description,
        position: taskCounter + 1,
        done: isDone
      });

      taskCounter++;
      console.log(`  ✓ Task ${taskCounter}: "${taskTemplate.title}" → ${stage.title}`);
    }

    console.log('\n\n✨ Mobile App Development project seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Project: Mobile App Development`);
    console.log(`   - Stages created: ${MOBILE_APP_STAGES.length}`);
    console.log(`   - Tasks created: ${MOBILE_APP_TASK_TEMPLATES.length}`);
    console.log(`   - Distribution: 4 Backlog, 5 In Development, 3 Testing, 3 Completed`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run seed
seedMobileAppProject();
