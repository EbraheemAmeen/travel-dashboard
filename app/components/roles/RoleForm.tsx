'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPermissions } from '@/app/actions/roles/getPermissions';
import { getRoleById } from '@/app/actions/roles/getRoleById';
import { createRole } from '@/app/actions/roles/createRole';
import { updateRole } from '@/app/actions/roles/updateRole';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface RoleFormProps {
  mode: 'add' | 'edit';
  roleId?: number;
}

export default function RoleForm({ mode, roleId }: RoleFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: permissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
  });

  const { data: role, isLoading: loadingRole } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => (roleId ? getRoleById(roleId) : null),
    enabled: mode === 'edit' && !!roleId,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && role) {
      setName(role.name || '');
      setDescription(role.description || '');
      setSelectedPermissions(role.rolePermissions?.map((rp: any) => rp.permissionId) || []);
    } else if (mode === 'add') {
      setName('');
      setDescription('');
      setSelectedPermissions([]);
    }
  }, [role, mode]);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; permissionIds: number[] }) => createRole(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['role', data.id] });
      }
      router.push('/roles');
    },
    onError: (e: any) => setError(e.message || 'Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description: string; permissionIds: number[] }) => updateRole(data.id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
      router.push('/roles');
    },
    onError: (e: any) => setError(e.message || 'Failed to update role'),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (mode === 'add') {
      createMutation.mutate({ name, description, permissionIds: selectedPermissions });
    } else if (mode === 'edit' && roleId) {
      updateMutation.mutate({ id: roleId, name, description, permissionIds: selectedPermissions });
    }
  };

  const handlePermissionChange = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const loading =
    loadingPermissions ||
    (mode === 'edit' && loadingRole) ||
    createMutation.status === 'pending' ||
    updateMutation.status === 'pending';

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">{mode === 'add' ? 'Add New Role' : 'Edit Role'}</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow p-6 max-w-xl mx-auto flex flex-col gap-6">
        <div>
          <label className="block mb-2 font-semibold">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required disabled={loading} />
        </div>
        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required disabled={loading} />
        </div>
        <div>
          <label className="block mb-2 font-semibold">Permissions</label>
          <div className="max-h-64 overflow-y-auto border border-gray-700 rounded p-2 bg-gray-900">
            {loadingPermissions ? (
              <div className="text-gray-400 py-4">Loading permissions...</div>
            ) : permissions && permissions.length > 0 ? (
              permissions.map((perm: Permission) => (
                <label key={perm.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => handlePermissionChange(perm.id)}
                    className="accent-indigo-600"
                    disabled={loading}
                  />
                  <span className="font-mono text-sm">{perm.name}</span>
                  <span className="text-xs text-gray-400">{perm.description}</span>
                </label>
              ))
            ) : (
              <div className="text-gray-400 py-4">No permissions found.</div>
            )}
          </div>
        </div>
        {error && <div className="text-red-400">{error}</div>}
        <div className="flex gap-4 justify-end">
          <button type="button" className="px-4 py-2 bg-gray-700 rounded" onClick={() => router.push('/roles')} disabled={loading}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </main>
  );
} 