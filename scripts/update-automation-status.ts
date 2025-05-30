import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    status: { type: 'string' },
  },
});

const { status } = values;

if (!status) {
  console.error('Status is required');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStatus() {
  try {
    const { error } = await supabase
      .from('seo_automation_logs')
      .update({
        status: status === 'success' ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('status', 'in_progress')
      .is('completed_at', null);

    if (error) throw error;
    console.log('Successfully updated automation status');
  } catch (error) {
    console.error('Error updating automation status:', error);
    process.exit(1);
  }
}

updateStatus(); 