// components/SideBar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Plane,
  Globe,
  Landmark,
  Hotel,
  Settings,
  Camera,
  Globe2Icon,
  UserCircle2Icon,
  PlaneTakeoff,
  LogOut,
} from 'lucide-react'
import { logout } from '../actions/logout'
import { useAuthStore } from '@/store/useAuthStore' // Corrected path if it's in lib

const SideBar = () => {
  const pathname = usePathname()
  const clientLogout = useAuthStore((state) => state.logout)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  // ✅ Get the hydration status from the store
  const hasHydrated = useAuthStore((state) => state._hasHydrated)

  const allSidebarItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    {
      name: 'Countries',
      path: '/countries',
      icon: <Globe className="w-5 h-5" />,
      permission: 'country:read',
    },
    {
      name: 'Cities',
      path: '/cities',
      icon: <Globe2Icon className="w-5 h-5" />,
      permission: 'city:read',
    },
    {
      name: 'Users',
      path: '/users',
      icon: <UserCircle2Icon className="w-5 h-5" />,
      permission: 'user:read:all',
    },
    { name: 'Balance Requests', path: '/balance-requests', icon: <Globe2Icon className="w-5 h-5" /> },
    { name: 'Transactions', path: '/transactions', icon: <Globe2Icon className="w-5 h-5" /> },
    { name: 'Media', path: '/media', icon: <Camera className="w-5 h-5" /> },
    { name: 'Orders', path: '/orders', icon: <Plane className="w-5 h-5" /> },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      permission: 'system:settings:manage',
    },
  ]

  // Filter the list based on the user's permissions
  const visibleSidebarItems = allSidebarItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  const handleLogout = async () => {
    clientLogout()
    await logout()
  }

  return (
    <div className="h-screen w-1/5 sticky overflow-y-auto top-0 bg-indigo-950 text-white flex flex-col justify-between shadow-lg">
      <div>
        <div className="p-4 text-2xl font-bold border-b border-indigo-800">
          Logo/App Name
        </div>
        <nav className="flex flex-col">
          {/* ✅ Conditionally render the items only AFTER the store has hydrated */}
          {hasHydrated &&
            visibleSidebarItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={`flex items-center px-6 py-5 text-lg transition-all duration-200 hover:bg-indigo-700 hover:pl-8 border-b border-indigo-800 ${
                  pathname === item.path ? 'bg-indigo-800 font-semibold' : ''
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                {item.name}
              </Link>
            ))}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center w-full px-6 py-5 text-lg transition-all duration-200 hover:bg-red-700 border-t border-indigo-800"
      >
        <LogOut className="mr-3 w-5 h-5" />
        Logout
      </button>
    </div>
  )
}

export default SideBar
