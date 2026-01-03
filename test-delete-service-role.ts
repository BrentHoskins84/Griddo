// TEMPORARY TEST FILE - DELETE AFTER DEBUGGING
// Run with: npx ts-node test-delete-service-role.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testDelete() {
  const contestId = 'e0bf47e0-7dc8-4fd9-b622-d0e4246a7655'; // Your contest ID
  
  console.log('Testing UPDATE with service role (bypasses RLS)...');
  
  const { data, error } = await supabase
    .from('contests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contestId);
  
  console.log('Result:', { data, error });
  
  if (!error) {
    console.log('✅ UPDATE works with service role - confirms RLS is the issue');
    
    // Restore it
    console.log('Restoring deleted_at to NULL...');
    await supabase
      .from('contests')
      .update({ deleted_at: null })
      .eq('id', contestId);
    console.log('✅ Restored');
  }
}

testDelete();
