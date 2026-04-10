import { supabase } from '../lib/supabase';
export { supabase };

export const getTeachers = async () => {
  const { data, error } = await supabase
    .from('teachers').select('id, user_id, full_name, department')
    .eq('is_approved', true).order('full_name');
  if (error) throw error;
  return data;
};

export const registerProject = async (projectData) => {
  const { data, error } = await supabase
    .from('projects').insert(projectData).select().single();
  if (error) throw error;
  return data;
};

export const getMyProject = async (studentId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*, teachers(full_name, department)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const updateProject = async (projectId, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', projectId).select().single();
  if (error) throw error;
  return data;
};

export const getTeacherProjects = async (teacherId, filters={}) => {
  let query = supabase.from('projects')
    .select('*, students(full_name, roll_number, department, year)')
    .eq('mentor_id', teacherId)
    .order('created_at', { ascending: false });
  if (filters.status && filters.status !== 'All')
    query = query.eq('status', filters.status);
  if (filters.domain && filters.domain !== 'All')
    query = query.eq('domain', filters.domain);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const approveProject = async (projectId, remarks='') => {
  const { data, error } = await supabase.from('projects')
    .update({ status: 'Approved', remarks, updated_at: new Date() })
    .eq('id', projectId).select().single();
  if (error) throw error;
  return data;
};

export const rejectProject = async (projectId, remarks) => {
  const { data, error } = await supabase.from('projects')
    .update({ status: 'Rejected', remarks, updated_at: new Date() })
    .eq('id', projectId).select().single();
  if (error) throw error;
  return data;
};

export const getTeacherStats = async (teacherId) => {
  const { data: projects } = await supabase
    .from('projects').select('status, domain, student_id, type')
    .eq('mentor_id', teacherId);
  if (!projects) return {};
  const total    = projects.length;
  const pending  = projects.filter(p => p.status === 'Pending').length;
  const approved = projects.filter(p => p.status === 'Approved').length;
  const rejected = projects.filter(p => p.status === 'Rejected').length;
  const students = new Set(projects.map(p => p.student_id)).size;
  const domains  = projects.reduce((acc, p) => {
    acc[p.domain] = (acc[p.domain] || 0) + 1; return acc;
  }, {});
  const types    = projects.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1; return acc;
  }, {});
  return { total, pending, approved, rejected, students, domains, types };
};
