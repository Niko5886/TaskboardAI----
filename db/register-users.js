/**
 * User Registration Helper
 * Creates 3 test users in Supabase Auth
 * Run this first to get user IDs, then update seed migration
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gctubqqiyvetzqidjxsv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is not set');
  console.error('Please set your service role key and try again');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS_TO_CREATE = [
  { email: 'nik@gmail.com', password: 'TestPassword123!' },
  { email: 'maria@gmail.com', password: 'TestPassword123!' },
  { email: 'peter@gmail.com', password: 'TestPassword123!' }
];

async function registerUsers() {
  console.log('🔐 Registering users in Supabase Auth...\n');

  const userIds = [];

  for (const userCreds of USERS_TO_CREATE) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userCreds.email,
        password: userCreds.password,
        email_confirm: true
      });

      if (error) {
        console.log(`⚠ ${userCreds.email}: ${error.message}`);
      } else {
        console.log(`✓ ${userCreds.email}`);
        console.log(`  ID: ${data.user.id}\n`);
        userIds.push({ email: userCreds.email, id: data.user.id });
      }
    } catch (err) {
      console.error(`❌ Error registering ${userCreds.email}:`, err.message);
    }
  }

  console.log('\n📋 Copy these UUIDs to update the seed migration:');
  console.log('```');
  userIds.forEach((user, i) => {
    console.log(`-- ${user.email}: ${user.id}`);
  });
  console.log('```');

  return userIds;
}

registerUsers().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
