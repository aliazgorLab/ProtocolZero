import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../features/notifications/notificationsSlice';
import { useToast } from '../context/ToastContext';

const Alerts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const { items: notifications, loading, unreadCount } = useSelector((state) => state.notifications);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      showToast("All notifications marked as read", "success");
    } catch (err) {
      console.error("Mark all read failed:", err);
      showToast("Failed to mark all as read.", "error");
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      dispatch(markNotificationAsRead(notif._id));
    }

    const type = notif.type || '';

    // Deep Link Navigation logic
    if (type.includes('report') || type.includes('incident') || notif.referenceModel === 'Report') {
      const targetId = notif.referenceId?.postId || notif.referenceId?._id || notif.referenceId;
      if (targetId) {
        navigate(`/reports/${targetId}`);
        return;
      }
    }

    if (type.includes('verification_pending')) {
      navigate('/admin#pending');
      return;
    }

    if (type.includes('verification_status') || type.includes('account')) {
      navigate('/profile');
      return;
    }

    if (notif.referenceId) {
      const targetId = notif.referenceId?.postId || notif.referenceId?._id || notif.referenceId;
      if (targetId) navigate(`/reports/${targetId}`);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const isUnread = !n.read;
    if (filter === 'unread') return isUnread;
    if (filter === 'incident') return n.type?.toLowerCase().includes('report') || n.type?.toLowerCase().includes('incident');
    if (filter === 'system') return n.type?.toLowerCase().includes('account') || n.type?.toLowerCase().includes('system') || n.type?.toLowerCase().includes('verification');
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24 text-on-background pt-14">
      {/* Sticky Header */}
      <div className="bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 sticky top-14 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              Alerts & Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-alert-red text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                {unreadCount} NEW
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-on-surface text-surface shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            All ({notifications.length})
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'unread' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button 
            onClick={() => setFilter('incident')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'incident' ? 'bg-alert-red text-white shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            Incidents
          </button>
          <button 
            onClick={() => setFilter('system')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'system' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            System
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-4 space-y-3 max-w-4xl mx-auto">
        {loading && notifications.length === 0 ? (
          /* Loading Skeletons */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-outline-variant/20 bg-surface p-4 animate-pulse flex gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-high shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-surface-container-high rounded w-1/3"></div>
                  <div className="h-3 bg-surface-container-high rounded w-3/4"></div>
                  <div className="h-2 bg-surface-container-high rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State Illustration */
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant bg-surface-container rounded-3xl border border-outline-variant/30 mt-4 px-6 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-outline opacity-60">notifications_off</span>
            </div>
            <h3 className="font-bold text-on-surface text-lg">No Notifications Match Filter</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm leading-relaxed">
              Regional disaster alerts, comment updates, and verification status notifications will appear here.
            </p>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.read;
            const isIncident = notif.type?.includes('report') || notif.type?.includes('incident');

            return (
              <div 
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-sm ${
                  isUnread 
                    ? 'bg-surface border-primary/40 shadow-md ring-1 ring-primary/20' 
                    : 'bg-surface-container-lowest border-outline-variant/20 opacity-80 hover:opacity-100 hover:border-outline-variant'
                }`}
              >
                {isUnread && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse"></div>
                )}
                
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                    isIncident ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {isIncident ? 'crisis_alert' : 'notifications'}
                    </span>
                  </div>
                  
                  <div className="flex-1 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-sm ${isUnread ? 'text-on-surface font-black' : 'text-on-surface-variant'}`}>
                        {notif.type ? notif.type.toUpperCase().replace(/_/g, ' ') : 'SYSTEM ALERT'}
                      </h3>
                      {isUnread && (
                        <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded font-black uppercase">NEW</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mb-2 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alerts;
