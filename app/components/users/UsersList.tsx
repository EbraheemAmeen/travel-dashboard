'use client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getUsers } from '@/app/actions/users/getUsers';
import { getRoles } from '@/app/actions/roles/getRoles';
import { deleteUser } from '@/app/actions/users/deleteUser';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function UsersList({ imagesUrl }: { imagesUrl: string }) {
  const queryClient = useQueryClient();
  const [roleId, setRoleId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: any | null }>({ open: false, user: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { user: loggedInUser } = useAuthStore();

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', { offset, limit, sortBy, order, roleId }],
    queryFn: () => getUsers({ offset, limit, sortBy, order, roleId }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      setDeleteModal({ open: false, user: null });
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: any) => setDeleteError(e.message || 'Failed to delete user'),
  });

  const users = data?.data || [];
  const meta = data?.meta || {};

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Link href="/users/new">
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold">Add New User</button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <label className="flex items-center gap-2">
          <span>Role:</span>
          <select
            value={roleId ?? ''}
            onChange={e => setRoleId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="">All</option>
            {roles && roles.map((role: any) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Sort By:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'name')}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Order:</span>
          <select
            value={order}
            onChange={e => setOrder(e.target.value as 'asc' | 'desc')}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Limit:</span>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            {[10, 20, 50, 100].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-4">
        {isLoading && <div className="text-center py-8">Loading...</div>}
        {isError && <div className="text-center py-8 text-red-400">{(error as Error).message || 'Failed to load users.'}</div>}
        {!isLoading && !isError && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2 px-2">Avatar</th>
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Username</th>
                <th className="py-2 px-2">Email</th>
                <th className="py-2 px-2">Role</th>
                <th className="py-2 px-2">Active</th>
                <th className="py-2 px-2">Created</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No users found.</td></tr>
              )}
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-2 px-2">
                    {user.avatar ? (
                      <img src={`${imagesUrl}${user.avatar}`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">?</div>
                    )}
                  </td>
                  <td className="py-2 px-2 font-semibold">{user.name}</td>
                  <td className="py-2 px-2">{user.username}</td>
                  <td className="py-2 px-2">{user.email}</td>
                  <td className="py-2 px-2">{user.role?.name}</td>
                  <td className="py-2 px-2">{user.isActive ? 'Yes' : 'No'}</td>
                  <td className="py-2 px-2">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</td>
                  <td className="py-2 px-2 flex gap-2">
                    <Link href={`/users/edit/${user.id}`}><button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Edit</button></Link>
                    {loggedInUser?.id !== user.id && <button
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                          onClick={() => setDeleteModal({ open: true, user })}
                      >
                        Delete
                      </button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {!isLoading && !isError && meta.totalItems > limit && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(meta.totalItems / limit)}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= meta.totalItems}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleteModal({ open: false, user: null })}>
          <div className="bg-gray-900 rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-white">Are you sure you want to delete <span className="text-red-400">{deleteModal.user.name}</span>?</h2>
            {deleteError && <div className="text-red-400 mb-2">{deleteError}</div>}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                disabled={deleteMutation.status === 'pending'}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteModal.user.id)}
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