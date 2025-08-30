'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWalletTransactions } from '@/app/actions/wallet/getWalletTransactions'

interface TransactionItem {
  id: number
  walletId: string
  amount: string
  source: string
  status: string
  note?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', page, limit, search, status, source],
    queryFn: () =>
      getWalletTransactions({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        source: source || undefined,
      }),
  })

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Transactions</h2>

      <div className="flex space-x-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or note" className="p-2 bg-gray-800 text-white rounded w-1/3" />

        <select value={status ?? ''} onChange={(e) => setStatus(e.target.value || null)} className="p-2 bg-gray-800 text-white rounded">
          <option value="">All statuses</option>
          <option value="POSTED">POSTED</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
        </select>

        <select value={source ?? ''} onChange={(e) => setSource(e.target.value || null)} className="p-2 bg-gray-800 text-white rounded">
          <option value="">All sources</option>
          <option value="TOPUP">TOPUP</option>
          <option value="BOOKING">BOOKING</option>
        </select>

        <button onClick={() => setPage(1)} className="px-3 py-1 bg-indigo-700 rounded">Apply</button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error loading transactions</div>}

      <div className="space-y-3">
        {(data?.items?.length ?? 0) === 0 && <div>No transactions found</div>}

        {data?.items?.map((item: TransactionItem) => (
          <div key={item.id} className="p-4 bg-gray-800 rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{item.user?.name} ({item.user?.email})</div>
              <div className="text-sm text-gray-300">Amount: {item.amount}</div>
              <div className="text-sm text-gray-300">Source: {item.source}</div>
              <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
            <div className={`px-3 py-1 rounded ${item.status === 'POSTED' ? 'bg-green-600' : item.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-600'}`}>
              {item.status}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2 mt-4">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 bg-gray-700 rounded">Prev</button>
        <div>Page {page}</div>
        <button disabled={(data && data.total && Number(data.total) <= page * limit)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-700 rounded">Next</button>
      </div>
    </div>
  )
}

export default TransactionsPage 