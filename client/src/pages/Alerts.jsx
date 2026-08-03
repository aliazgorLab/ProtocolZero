import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';

const Alerts = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/notifications');
        if (res.data?.data) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      showToast("All notifications marked as read", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'incident') return n.type?.toLowerCase().includes('incident');
    if (filter === 'system') return n.type?.toLowerCase().includes('system');
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24 text-on-background pt-14">
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-14 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications_active</span>
            Alerts & Notifications
          </h2>
          {notifications.length > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
            >
              Mark all read
            </button>
          )}
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
            <p className="text-sm font-medium">Syncing notification stream...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/30 mt-4">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-40">notifications_off</span>
            <p className="font-bold text-on-surface text-base">No active alerts</p>
            <p className="text-xs text-on-surface-variant mt-1 text-center max-w-sm">Emergency broadcasts and system notices targeted to your zone will appear here.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif._id || notif.id}
              onClick={() => markSingleAsRead(notif._id)}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer ${
                notif.isRead 
                  ? 'bg-surface-container-lowest border-outline-variant/30 opacity-70' 
                  : 'bg-surface border-primary/30 shadow-[0_4px_20px_rgba(var(--primary),0.05)]'
              }`}
            >
              {!notif.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse"></div>
              )}
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">
                    {notif.type === 'incident' ? 'local_fire_department' : 'notifications'}
                  </span>
                </div>
                
                <div className="flex-1 pr-6">
                  <h3 className={`font-bold text-sm mb-1 ${notif.isRead ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                    {notif.title || 'System Alert'}
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-2 leading-relaxed">
                    {notif.message || notif.body}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
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
