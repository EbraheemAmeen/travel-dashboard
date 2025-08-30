'use client'

import React from 'react'
import BalanceRequestsList from '@/app/components/balance/BalanceRequestsList'

const Page = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Balance Requests</h1>
      <BalanceRequestsList />
    </div>
  )
}

export default Page


