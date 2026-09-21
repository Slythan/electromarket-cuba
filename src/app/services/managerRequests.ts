import { supabase } from '@/lib/supabase';
import type { ManagerRequest, Role } from '@/lib/types';

interface RequestRow {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  message: string;
  status: ManagerRequest['status'];
  created_at: string;
}

export interface UserRow {
  id: string;
  name: string | null;
  phone: string | null;
  role: Role;
}

const mapRequest = (row: RequestRow): ManagerRequest => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  phone: row.phone,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
});

export async function createManagerRequest(input: { userId: string; name: string; phone: string; message: string }) {
  const { error } = await supabase.from('manager_requests').insert({
    user_id: input.userId,
    name: input.name,
    phone: input.phone,
    message: input.message,
  });
  if (error) throw new Error(error.message);
}

export async function fetchManagerRequests(): Promise<ManagerRequest[]> {
  const { data, error } = await supabase.from('manager_requests').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RequestRow[]).map(mapRequest);
}

export async function updateManagerRequest(id: string, status: ManagerRequest['status']) {
  const { error } = await supabase.from('manager_requests').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchProfiles(): Promise<UserRow[]> {
  const { data, error } = await supabase.from('profiles').select('id,name,phone,role').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as UserRow[];
}

export async function updateProfileRole(id: string, role: Role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw new Error(error.message);
}