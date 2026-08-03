import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const SidebarMenu = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  
  const handleSignOut = () => {
    dispatch(logout());
    navigate('/');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-white/60 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-4/5 max-w-[340px] bg-surface-container-lowest z-[70] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header / Profile Summary */}
        <div className="p-4 border-b border-outline-variant/30 sticky top-0 bg-surface-container-lowest/95 backdrop-blur-sm z-10 flex justify-between items-center">
          <Link to="/profile" onClick={onClose} className="flex items-center gap-3 hover:bg-surface-container-low p-2 rounded-xl transition-colors flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-on-surface">{currentUser?.name || 'Citizen User'}</span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">View your profile</span>
            </div>
          </Link>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Shortcuts Grid */}
          <div>
            <h3 className="text-base font-bold text-on-surface mb-3">Your shortcuts</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Map', icon: 'map', color: 'bg-blue-100 text-blue-600', path: '/map' },
                { label: 'Alerts', icon: 'notifications_active', color: 'bg-red-100 text-red-600', path: '/alerts', badge: unreadCount },
                { label: 'Reports', icon: 'list_alt', color: 'bg-green-100 text-green-600', path: '/home' },
                { label: 'Verify', icon: 'verified_user', color: 'bg-purple-100 text-purple-600', path: '#' }
              ].map((item, idx) => (
                <Link to={item.path} onClick={onClose} key={idx} className="flex flex-col items-center gap-1 group relative">
                  <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform relative`}>
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-alert-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center truncate w-full">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Main Links */}
          <div className="space-y-1">
            {[
              { label: 'Incident History', icon: 'history' },
              { label: 'Saved Locations', icon: 'bookmark' },
              { label: 'Community Feed', icon: 'groups' },
              { label: 'Official Broadcasts', icon: 'campaign' }
            ].map((item, idx) => (
              <button key={idx} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
                <span className="font-medium text-on-surface text-base">{item.label}</span>
              </button>
            ))}
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-primary font-medium">
              See more
            </button>
          </div>

          <hr className="border-outline-variant/30" />

          {/* Settings & Support */}
          <div className="space-y-2">
            <details className="group">
              <summary className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[28px]">help</span>
                  <span className="font-bold text-on-surface text-base">Help and support</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="pl-12 pr-4 py-2 space-y-2">
                <p className="text-sm text-on-surface-variant hover:text-primary cursor-pointer">Help Center</p>
                <p className="text-sm text-on-surface-variant hover:text-primary cursor-pointer">Safety Protocols</p>
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[28px]">settings</span>
                  <span className="font-bold text-on-surface text-base">Settings and privacy</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="pl-12 pr-4 py-2 space-y-2">
                <Link to="/profile" onClick={onClose} className="block text-sm text-on-surface-variant hover:text-primary py-1">Account Settings</Link>
                <p className="text-sm text-on-surface-variant hover:text-primary py-1 cursor-pointer">Location Permissions</p>
              </div>
            </details>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors font-bold text-on-surface mt-4"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;
