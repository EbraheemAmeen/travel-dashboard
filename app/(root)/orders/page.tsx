'use client'

import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import getOrders from '@/app/actions/orders/getOrders'

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [userFilter, setUserFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, limit],
    queryFn: () => getOrders({ page, limit }),
  })

  const orders = (data?.data || []) as any[]

  const filtered = useMemo(() => {
    if (!userFilter.trim()) return orders
    return orders.filter((o: any) =>
      o.user?.name?.toLowerCase().includes(userFilter.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(userFilter.toLowerCase())
    )
  }, [orders, userFilter])

  if (isLoading) return <div>Loading orders...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      <div className="mb-4 flex items-center gap-2">
        <input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder="Filter by user name or email" className="px-3 py-2 border rounded bg-gray-800 text-white" />
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-3 py-2 bg-gray-800 text-white rounded">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((o: any) => (
          <div key={o.orderId} className="bg-gray-800 p-4 rounded">
            <div className="flex justify-between">
              <div>
                <div className="text-white font-semibold">Order #{o.orderId} — {o.status}</div>
                <div className="text-gray-400 text-sm">{o.user?.name} — {o.user?.email}</div>
                <div className="text-gray-400 text-sm">Total: {o.total}</div>
                <div className="text-gray-400 text-sm">Created: {new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-300">Items: {o.items?.length || 0}</div>
                <div className="text-gray-300">Bookings: {o.bookings?.length || 0}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {o.items?.map((it: any) => (
                <div key={it.id} className="p-2 border border-gray-700 rounded">
                  <div className="text-white font-medium">{it.type}</div>
                  {it.type === 'ROOM' && (
                    <div className="text-gray-400 text-sm">Hotel: {it.hotelId} — RoomType: {it.roomTypeLabel} — Qty: {it.quantity}</div>
                  )}
                  {it.type === 'TRIP' && (
                    <div className="text-gray-400 text-sm">Trip: {it.trip?.name} — Seats: {it.quantity}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 bg-gray-700 rounded">Prev</button>
        <div className="text-gray-300">Page {page}</div>
        <button onClick={() => setPage((p) => p + 1)} className="px-3 py-2 bg-gray-700 rounded">Next</button>
      </div>
    </div>
  )
}


