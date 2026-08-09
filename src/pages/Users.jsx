import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { toast } from 'react-toastify';
import { Trash2, UserPlus } from 'lucide-react';

export default function Users() {
  const { data } = useQuery('users', () => api.get('/users').then((r) => r.data.users));
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const ownerCount = (data || []).filter((u) => u.role === 'owner').length;
  const staffCount = (data || []).filter((u) => u.role === 'staff').length;

  async function deleteUser(id) {
    if (!confirm('Remove this user account?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User removed');
      qc.invalidateQueries('users');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove user');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold">Users</h1>
          <p className="text-sm text-gray-500">{ownerCount}/4 Owner accounts · {staffCount}/1 Staff account</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr></thead>
          <tbody>
            {(data || []).map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.phone || '—'}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.is_active ? <span className="badge bg-green-100 text-green-700">Active</span> : <span className="badge bg-gray-200 text-gray-600">Inactive</span>}</td>
                <td>{u.last_login ? new Date(u.last_login).toLocaleString('en-IN') : '—'}</td>
                <td><button onClick={() => deleteUser(u.id)} className="text-red-500"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserForm
          ownerCount={ownerCount}
          staffCount={staffCount}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries('users'); }}
        />
      )}
    </div>
  );
}

function UserForm({ ownerCount, staffCount, onClose, onSaved }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  async function onSubmit(values) {
    try {
      await api.post('/users', values);
      toast.success('User created');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-sm space-y-3">
        <h3 className="font-semibold">Add User</h3>
        <input className="input" placeholder="Full Name" {...register('name', { required: true })} />
        <input className="input" type="email" placeholder="Email" {...register('email', { required: true })} />
        <input className="input" placeholder="Phone" {...register('phone')} />
        <input className="input" type="password" placeholder="Password (min 8 chars)" {...register('password', { required: true, minLength: 8 })} />
        <select className="input" {...register('role', { required: true })}>
          <option value="staff" disabled={staffCount >= 1}>Staff {staffCount >= 1 ? '(limit reached)' : ''}</option>
          <option value="owner" disabled={ownerCount >= 4}>Owner {ownerCount >= 4 ? '(limit reached)' : ''}</option>
        </select>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Saving…' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
}
