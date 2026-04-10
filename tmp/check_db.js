
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  console.log('Checking projects for Swanandi Deshkar...');
  
  // 1. Find the student
  const { data: students, error: sError } = await supabase
    .from('students')
    .select('*')
    .ilike('full_name', '%Swanandi%');
    
  if (sError) {
    console.error('Error fetching student:', sError);
    return;
  }
  
  if (!students || students.length === 0) {
    console.log('No student found matching Swanandi.');
    return;
  }
  
  console.log('Found students:', students.map(s => ({ id: s.id, user_id: s.user_id, name: s.full_name })));
  
  for (const student of students) {
    // 2. Check projects by user_id
    const { data: projectsByUid, error: pError1 } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', student.user_id);
      
    console.log(`Projects for user_id ${student.user_id}:`, projectsByUid?.length || 0);
    if (projectsByUid && projectsByUid.length > 0) {
      console.log('Project Titles:', projectsByUid.map(p => p.title));
    }

    // 3. Check projects by numeric id
    const { data: projectsByNid, error: pError2 } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', student.id);
      
    console.log(`Projects for numeric id ${student.id}:`, projectsByNid?.length || 0);
    if (projectsByNid && projectsByNid.length > 0) {
      console.log('Project Titles:', projectsByNid.map(p => p.title));
    }
  }
}

checkProjects();
