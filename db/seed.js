/**
 * Database Seed Script
 * =====================
 * Seeds the Taskboard database with sample data:
 * - 3 users (via Supabase Auth)
 * - 3 projects (1 per user)
 * - Standard stages: "Not Started", "In Progress", "Done"
 * - 10 tasks per project, distributed across stages
 *
 * Usage: node db/seed.js
 */

import https from 'https';
import { URL } from 'url';

// Configuration
const SUPABASE_URL = 'https://gctubqqiyvetzqidjxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdHVicXFpeXZldHpxaWRqeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODIwOTEsImV4cCI6MjA4NjU1ODA5MX0.1CaZYpLwBzItBIHKdfsL3fQ9wS5DVMWyLA69UUV-5pg';

// Sample users to create
const USERS_TO_CREATE = [
  { email: 'nik@gmail.com', password: 'TestPassword123!' },
  { email: 'maria@gmail.com', password: 'TestPassword123!' },
  { peter: 'peter@gmail.com', password: 'TestPassword123!' }
];

// Standard stages
const STANDARD_STAGES = [
  { title: 'Not Started', position: 1 },
  { title: 'In Progress', position: 2 },
  { title: 'Done', position: 3 }
];

// Sample task templates (10 per project)
const SAMPLE_TASK_TEMPLATES = [
  { title: 'Setup project structure', description: '<p>Initialize folder and file structure</p>' },
  { title: 'Create database schema', description: '<p>Design and implement database tables</p>' },
  { title: 'Implement authentication', description: '<p>Setup user signup and login flow</p>' },
  { title: 'Build dashboard UI', description: '<p>Create responsive dashboard layout</p>' },
  { title: 'Add task management features', description: '<p>Implement create, edit, delete tasks</p>' },
  { title: 'Implement drag and drop', description: '<p>Add task reordering within stages</p>' },
  { title: 'Create REST API endpoints', description: '<p>Build API for all CRUD operations</p>' },
  { title: 'Add form validation', description: '<p>Client and server-side validation</p>' },
  { title: 'Setup error handling', description: '<p>Global error handling and UI feedback</p>' },
  { title: 'Deploy to production', description: '<p>Deploy app to Netlify</p>' }
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
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    const createdUsers = [];

    // Step 1: Register users via Supabase Auth
    console.log('📝 Step 1: Registering users...');
    for (const userCreds of USERS_TO_CREATE) {
      const email = userCreds.email;
      const password = userCreds.password;
      try {
        const response = await supabaseRequest('POST', '/auth/v1/signup', {
          email,
          password
        });
        console.log(`  ✓ User registered: ${email}`);
        createdUsers.push({ email, id: response.user.id });
      } catch (err) {
        console.log(`  ⚠ Error registering ${email}: ${err.message}`);
        // Continue with seed even if auth registration fails (user might already exist)
      }
    }

    if (createdUsers.length === 0) {
      console.log('\n⚠️  No users were registered. Fetching existing users from auth...');
      // Try to fetch users if they already exist
      for (const userCreds of USERS_TO_CREATE) {
        createdUsers.push({ email: userCreds.email, id: null });
      }
    }

    console.log(`\n📊 Step 2: Creating projects and stages...`);
    const projectsWithStages = [];

    for (const user of createdUsers) {
      const projectTitle = `${user.email.split('@')[0]}'s Project`;

      // Create project
      const projectRes = await supabaseRequest('POST', '/rest/v1/projects', {
        title: projectTitle,
        owner_id: user.id,
        description: `Sample project for ${user.email}`
      });

      const projectId = projectRes[0]?.id;
      console.log(`  ✓ Project created: ${projectTitle} (ID: ${projectId})`);

      // Create standard stages for this project
      const stagesForProject = [];
      for (const stage of STANDARD_STAGES) {
        const stageRes = await supabaseRequest('POST', '/rest/v1/project_stages', {
          project_id: projectId,
          title: stage.title,
          position: stage.position
        });
        const stageId = stageRes[0]?.id;
        stagesForProject.push({ ...stage, id: stageId });
        console.log(`    ✓ Stage created: ${stage.title}`);
      }

      projectsWithStages.push({
        projectId,
        userId: user.id,
        stages: stagesForProject
      });
    }

    // Step 3: Create tasks distributed across stages
    console.log(`\n✅ Step 3: Creating 10 tasks per project...`);
    for (const project of projectsWithStages) {
      console.log(`\n  Tasks for project ${project.projectId}:`);

      for (let i = 0; i < SAMPLE_TASK_TEMPLATES.length; i++) {
        const taskTemplate = SAMPLE_TASK_TEMPLATES[i];
        // Distribute tasks across stages: 3 Not Started, 4 In Progress, 3 Done
        let stageIndex = 0;
        if (i < 3) stageIndex = 0; // Not Started
        else if (i < 7) stageIndex = 1; // In Progress
        else stageIndex = 2; // Done

        const stageId = project.stages[stageIndex].id;
        const position = (i % 4) + 1; // Position within stage

        const taskRes = await supabaseRequest('POST', '/rest/v1/tasks', {
          project_id: project.projectId,
          stage_id: stageId,
          title: taskTemplate.title,
          description_html: taskTemplate.description,
          position: position,
          done: stageIndex === 2 // Mark tasks in "Done" stage as done
        });

        console.log(`    ✓ Task ${i + 1}: "${taskTemplate.title}" → ${project.stages[stageIndex].title}`);
      }
    }

    console.log('\n\n✨ Database seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Users registered: ${createdUsers.length}`);
    console.log(`   - Projects created: ${projectsWithStages.length}`);
    console.log(`   - Stages per project: ${STANDARD_STAGES.length}`);
    console.log(`   - Total tasks created: ${projectsWithStages.length * SAMPLE_TASK_TEMPLATES.length}`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    process.exit(1);
  }
}

// Run seed
seed();
