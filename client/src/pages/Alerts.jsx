import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Alerts = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  
  // Fake state for UI demonstration
  const [filter, setFilter] = useState('all');
  
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'incident',
      title: 'Major Incident Proximity Alert',
      message: 'A Structure Fire has been reported 0.5km from your registered Home Address.',
      time: '2 mins ago',
      read: false,
      icon: 'local_fire_department',
      color: 'text-alert-red',
      bg: 'bg-alert-red/10'
    },
    {
      id: 2,
      type: 'system',
      title: 'Clearance Level Verified',
      message: 'Your credentials have been validated by Command. You now have Level 4 Clearance.',
      time: '1 hour ago',
      read: false,
      icon: 'verified_user',
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      id: 3,
      type: 'incident',
      title: 'Evacuation Route Update',
      message: 'Safe Haven Delta route has been confirmed clear by Response Team Guardian-1.',
      time: '3 hours ago',
      read: true,
      icon: 'route',
      color: 'text-tertiary',
      bg: 'bg-tertiary/10'
    },
    {
      id: 4,
      type: 'system',
      title: 'Security Notice',
      message: 'New login detected from a new IP address in Sector 7.',
      time: 'Yesterday',
      read: true,
      icon: 'security',
      color: 'text-[#FFB000]',
      bg: 'bg-[#FFB000]/10'
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'incident') return n.type === 'incident';
    if (filter === 'system') return n.type === 'system';
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24 text-on-background pt-14">
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-14 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications_active</span>
            Alerts
          </h2>
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
          >
            Mark all read
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-on-surface text-surface' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${filter === 'unread' ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
          >
            Unread
          </button>
          <button 
            onClick={() => setFilter('incident')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${filter === 'incident' ? 'bg-alert-red text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
          >
            Incidents
          </button>
          <button 
            onClick={() => setFilter('system')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${filter === 'system' ? 'bg-[#FFB000] text-black' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
          >
            System
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-4 space-y-3 max-w-4xl mx-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">notifications_off</span>
            <p className="font-medium text-center">No alerts match your criteria.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                notif.read 
                  ? 'bg-surface-container-lowest border-outline-variant/30 opacity-70' 
                  : 'bg-surface border-primary/30 shadow-[0_4px_20px_rgba(var(--primary),0.05)]'
              }`}
            >
              {!notif.read && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse"></div>
              )}
              
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${notif.bg}`}>
                  <span className={`material-symbols-outlined ${notif.color}`}>{notif.icon}</span>
                </div>
                
                <div className="flex-1 pr-6">
                  <h3 className={`font-bold text-sm mb-1 ${notif.read ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                    {notif.time}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
