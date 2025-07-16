// A standalone script to update a user to be an admin.
// Run this from your terminal in the backend directory: node make-admin.js

require('dotenv').config(); // Load environment variables from .env file
const { createClient } = require('@supabase/supabase-js');

// This script requires the Supabase SERVICE_ROLE_KEY.
// It is read from your .env file.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const updateUserToAdmin = async (userId) => {
  if (!userId) {
    console.error("Error: No user ID provided.");
    return;
  }
  
  console.log(`Attempting to promote user ${userId} to admin...`);

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { role: 'admin' } }
  );

  if (error) {
    console.error('Error updating user:', error.message);
    return;
  }
  
  console.log('✅ User updated successfully! The user is now an admin.');
  console.log('Email:', data.user.email);
  console.log('New Role:', data.user.user_metadata.role);
};

// --- This is the user that will be promoted to admin ---
const userIdToPromote = 'a7c04b90-4a41-4b77-b7f8-2411baa4a9c1';

updateUserToAdmin(userIdToPromote);