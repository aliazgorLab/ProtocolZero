import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import SidebarMenu from '../components/SidebarMenu';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [isSosActive, setIsSosActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const handleSosClick = () => {
    navigate('/sos');
  };

  const navItems = [
    { icon: 'rss_feed', label: 'Feed', path: '/home', activeIcon: 'fill-icon' },
    { icon: 'map', label: 'Map', path: '/map', activeIcon: '' },
    { icon: 'notifications', label: 'Alerts', path: '/alerts', activeIcon: '' },
    { icon: 'person', label: 'Profile', path: '/profile', activeIcon: '' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen text-base overflow-x-hidden">
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm flex justify-between items-center px-4 h-14 border-b border-outline-variant/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="material-symbols-outlined text-primary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95"
          >
            menu
          </button>
          <Link to="/home" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
            Protocol Zero
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button className="material-symbols-outlined text-primary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">search</button>
        </div>
      </header>

      {/* Main Content Area */}
      <Outlet />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 py-3 pb-safe bg-surface/90 backdrop-blur-lg shadow-lg rounded-t-xl pb-[env(safe-area-inset-bottom)]">
        {/* First two items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.label} 
              to={item.path} 
              className={`flex flex-col items-center justify-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className={`material-symbols-outlined ${isActive && item.activeIcon ? item.activeIcon : ''}`}>{item.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Central SOS Button */}
        <div className="relative -top-6">
          <button 
            onClick={handleSosClick}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl z-50 border-4 border-white/20 active:scale-90 transition-all ${
              isSosActive ? 'bg-black text-alert-red' : 'bg-alert-red text-white sos-pulse'
            }`}
          >
            {isSosActive ? (
              <span className="text-[14px] font-black tracking-tighter uppercase mt-1">WAIT</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl font-bold fill-icon">emergency</span>
                <span className="text-[10px] font-black tracking-tighter -mt-1 uppercase">SOS</span>
              </>
            )}
          </button>
        </div>

        {/* Last two items */}
        {navItems.slice(2, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.label} 
              to={item.path} 
              className={`flex flex-col items-center justify-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className={`material-symbols-outlined ${isActive && item.activeIcon ? item.activeIcon : ''}`}>{item.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Sidebar Menu Drawer */}
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
