'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { translateError } from '@/lib/format';
import { fetchManagerRequests, fetchProfiles, updateManagerRequest, updateProfileRole, type UserRow } from '@/services/managerRequests';
import type { ManagerRequest, Role } from '@/lib/types';

export default function UsersTab() {
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { const [profiles, managerRequests] = await Promise.all([fetchProfiles(), fetchManagerRequests()]); setUsers(profiles); setRequests(managerRequests); } catch (error) { toast(translateError(error instanceof Error ? error.message : undefined)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const roleLabel: Record<Role, string> = { customer: 'Cliente final', manager: 'Gestor', admin: 'Administrador' };
  const changeRole = async (id: string, role: Role) => { try { await updateProfileRole(id, role); setUsers((current) => current.map((user) => user.id === id ? { ...user, role } : user)); toast('Rol actualizado'); } catch (error) { toast(translateError(error instanceof Error ? error.message : undefined)); } };
  const changeRequest = async (request: ManagerRequest, status: ManagerRequest['status']) => { try { await updateManagerRequest(request.id, status); setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item)); if (status === 'approved') await updateProfileRole(request.userId, 'manager'); toast('Solicitud actualizada'); } catch (error) { toast(translateError(error instanceof Error ? error.message : undefined)); } };
  if (loading) return <p className="muted">Cargando usuarios…</p>;
  return <div className="rows"><section><h2>Usuarios y roles</h2>{users.map((user) => <div className="prow" key={user.id}><div className="prow__info"><strong>{user.name || 'Sin nombre'}</strong><span className="muted">{user.phone || 'Sin teléfono'}</span></div><select className="input input--select" value={user.role} onChange={(event) => void changeRole(user.id, event.target.value as Role)}>{(Object.keys(roleLabel) as Role[]).map((role) => <option value={role} key={role}>{roleLabel[role]}</option>)}</select></div>)}</section><section><h2>Solicitudes de gestor</h2>{requests.length === 0 ? <div className="note">No hay solicitudes pendientes.</div> : requests.map((request) => <article className="order" key={request.id}><div className="order__head"><strong>{request.name}</strong><span className="muted">{request.phone}</span></div><p>{request.message}</p><span className="muted">{request.status}</span>{request.status === 'pending' && <div className="prow__actions"><button className="btn btn--sm" onClick={() => void changeRequest(request, 'approved')}>Aprobar</button><button className="btn btn--danger btn--sm" onClick={() => void changeRequest(request, 'rejected')}>Rechazar</button></div>}</article>)}</section></div>;
}