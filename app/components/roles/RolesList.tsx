'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoles } from '@/app/actions/roles/getRoles';
import { deleteRole } from '@/app/actions/roles/deleteRole';
import Link from 'next/link';
import { useState } from 'react';

export default function RolesList() {
  const queryClient = useQueryClient();
  const { data: roles, isLoading, isError, error } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; role: any | null }>({ open: false, role: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      setDeleteModal({ open: false, role: null });
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (e: any) => setDeleteError(e.message || 'Failed to delete role'),
  });

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Roles</h1>
        <Link href="/roles/new">
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold">Add New Role</button>
        </Link>
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-4">
        {isLoading && <div className="text-center py-8">Loading...</div>}
        {isError && <div className="text-center py-8 text-red-400">{(error as Error).message || 'Failed to load roles.'}</div>}
        {!isLoading && !isError && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Description</th>
                <th className="py-2 px-2">Permissions</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!roles || roles.length === 0) && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No roles found.</td></tr>
              )}
              {roles && roles.map((role: any) => (
                <tr key={role.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-2 px-2 font-semibold">{role.name}</td>
                  <td className="py-2 px-2 text-gray-300">{role.description}</td>
                  <td className="py-2 px-2 text-gray-400">{role.rolePermissions?.length ?? 0}</td>
                  <td className="py-2 px-2 flex gap-2">
                    <Link href={`/roles/${role.id}/edit`}><button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Edit</button></Link>
                    <button
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                      onClick={() => setDeleteModal({ open: true, role })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.role && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleteModal({ open: false, role: null })}>
          <div className="bg-gray-900 rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-white">Are you sure you want to delete <span className="text-red-400">{deleteModal.role.name}</span>?</h2>
            {deleteError && <div className="text-red-400 mb-2">{deleteError}</div>}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setDeleteModal({ open: false, role: null })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                disabled={deleteMutation.status === 'pending'}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteModal.role.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteMutation.status === 'pending'}
              >
                {deleteMutation.status === 'pending' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 