'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWalletRequests } from '@/app/actions/wallet/getWalletRequests'
import { approveWalletRequest } from '@/app/actions/wallet/approveWalletRequest'
import { rejectWalletRequest } from '@/app/actions/wallet/rejectWalletRequest'

interface RequestItem {
  id: string | number
  user: {
    id: string
    name: string
    email: string
    balance?: string
  }
  amount: string
  status: string
  note?: string
  createdAt: string
  updatedAt?: string
}

const BalanceRequestsList: React.FC = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selected, setSelected] = useState<RequestItem | null>(null)
  const [note, setNote] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['walletRequests', page, limit],
    queryFn: () => getWalletRequests({ page, limit }),
  })

  console.log("data", data)

  const approveMutation = useMutation({
    mutationFn: (vars: { id: string; note?: string }) => approveWalletRequest(vars.id, { note: vars.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletRequests'] })
      setSelected(null)
      setNote('')
      setActionType(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (vars: { id: string; note?: string }) => rejectWalletRequest(vars.id, { note: vars.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletRequests'] })
      setSelected(null)
      setNote('')
      setActionType(null)
    },
  })

  const handleOpen = (item: RequestItem, type: 'approve' | 'reject') => {
    setSelected(item)
    setActionType(type)
  }

  const handleConfirm = async () => {
    if (!selected || !actionType) return

    if (actionType === 'approve') {
      approveMutation.mutate({ id: String(selected.id), note })
    } else {
      rejectMutation.mutate({ id: String(selected.id), note })
    }
  }

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error loading requests</div>}

      <div className="space-y-4">
        {(data?.items?.length ?? 0) === 0 && <div>No requests found</div>}

        {data?.items?.map((item: RequestItem) => (
          <div key={item.id} className="p-4 bg-gray-800 rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{item.user?.name ?? item.user?.email}</div>
              <div className="text-sm text-gray-300">{item.user?.email}</div>
              <div className="text-sm text-gray-300">Amount: {item.amount}</div>
              <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded ${item.status === 'PENDING' ? 'bg-yellow-500' : item.status === 'APPROVED' ? 'bg-green-600' : 'bg-red-600'}`}>
                {item.status}
              </div>

              {item.status === 'PENDING' && (
                <div className="flex space-x-2">
                  <button onClick={() => handleOpen(item, 'approve')} className="px-3 py-1 bg-green-600 rounded">Approve</button>
                  <button onClick={() => handleOpen(item, 'reject')} className="px-3 py-1 bg-red-600 rounded">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination simple */}
      <div className="flex items-center space-x-2 mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 bg-gray-700 rounded">Prev</button>
        <div>Page {page}</div>
        <button disabled={(data && data.total && Number(data.total) <= page * limit)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-700 rounded">Next</button>
      </div>

      {/* Modal */}
      {selected && actionType && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" onClick={() => { setSelected(null); setActionType(null); setNote('') }}>
          <div className="bg-gray-900 p-6 rounded w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{actionType === 'approve' ? 'Approve' : 'Reject'} Request</h3>
            <p className="text-sm text-gray-400">Request by: {selected.user?.name ?? selected.user?.email}</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Admin note" className="w-full mt-2 p-2 bg-gray-800 text-white rounded" />

            <div className="flex justify-end space-x-2 mt-4">
              <button disabled={(approveMutation.status === 'pending') || (rejectMutation.status === 'pending')} onClick={() => { setSelected(null); setActionType(null); setNote('') }} className="px-3 py-1 bg-gray-600 rounded">Cancel</button>
              <button disabled={(approveMutation.status === 'pending') || (rejectMutation.status === 'pending')} onClick={handleConfirm} className="px-3 py-1 bg-blue-600 rounded">
                {((approveMutation.status === 'pending') || (rejectMutation.status === 'pending')) ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BalanceRequestsList


