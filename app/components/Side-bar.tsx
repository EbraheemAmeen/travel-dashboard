'use client'; // Mark this as a Client Component

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plane, Globe, Landmark, Hotel, Car, Settings , Camera, Globe2Icon, UserCircle2Icon, PlaneTakeoff } from 'lucide-react';
import { logout } from '../actions/logout';

const SideBar = () => {
  const pathname = usePathname();

  // Sidebar items data



  const sidebarItems = [
    { name: 'Home', path: '/home', icon: <Home className="w-5 h-5" /> },
    { name: 'Trips ', path: '/trips', icon: <PlaneTakeoff className="w-5 h-5" /> },
    { name: 'Countries', path: '/countries', icon: <Globe className="w-5 h-5" /> },
    { name: 'Cities', path: '/cities', icon: < Globe2Icon className="w-5 h-5" /> },

    { name: 'Airline Companies', path: '/airlines', icon: <Plane className="w-5 h-5" /> },
    { name: 'Tourist Attractions', path: '/attractions', icon: <Landmark className="w-5 h-5" /> },
    { name: 'Hotels', path: '/hotels', icon: <Hotel className="w-5 h-5" /> },
    { name: 'Guides', path: '/guides', icon: <UserCircle2Icon className="w-5 h-5" /> },
    { name: 'Media', path: '/media', icon: <Camera className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];


  const handleLogout = async () => {
     await logout();
  };

  return (
    <div className="h-screen w-1/5 sticky top-0  bg-indigo-950 text-white flex flex-col justify-between  shadow-lg">
<div>
        <div className="p-4 text-2xl font-bold border-b   ">
        Logo/App Name
      </div>

      <nav className="flex flex-col">
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center px-6 py-5 text-lg transition-all duration-200 hover:bg-indigo-700 hover:pl-8 border-b border-indigo-600 ${pathname === item.path ? 'bg-indigo-800 font-semibold' : ''
              }`}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
</div>

      <div className=" w-full p-4   text-center text-sm border-t border-indigo-700 "
        onClick={handleLogout}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleLogout(); }}
      >

        Logout
      </div>
    </div>
  );
};

export default SideBar;