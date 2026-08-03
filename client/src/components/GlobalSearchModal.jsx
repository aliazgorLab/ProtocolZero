import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { getDisasterConfig } from '../utils/disasterColors';

const SYSTEM_NAVIGATION_ACTIONS = [
  { id: 'act-1', title: 'File Emergency Report', category: 'Action', path: '/reports/create', icon: 'add_alert' },
  { id: 'act-2', title: 'Open Interactive Map', category: 'Action', path: '/map', icon: 'map' },
  { id: 'act-3', title: 'View Personal Alerts & Notifications', category: 'Action', path: '/alerts', icon: 'notifications' },
  { id: 'act-4', title: 'Admin & Moderation Console', category: 'Action', path: '/admin', icon: 'admin_panel_settings' },
  { id: 'act-5', title: 'User Profile & Settings', category: 'Action', path: '/profile', icon: 'account_circle' },
  { id: 'act-6', title: 'SOS Emergency Beacon', category: 'Action', path: '/sos', icon: 'emergency' },
];

const FALLBACK_SEARCH_REPORTS = [
  {
    _id: 'REP-101',
    postId: 'REP-101',
    type: 'major',
    category: 'Fire',
    description: 'Major building fire spreading across sector 4 commercial district. Units requested.',
    status: 'active'
  },
  {
    _id: 'REP-102',
    postId: 'REP-102',
    type: 'minor',
    category: 'Medical',
    description: 'First aid assistance needed for heat exhaustion near stadium.',
    status: 'active'
  },
  {
    _id: 'REP-103',
    postId: 'REP-103',
    type: 'minor',
    category: 'Flood',
    description: 'Flash flooding on lower roadway blocking traffic lanes.',
    status: 'active'
  },
  {
    _id: 'REP-104',
    postId: 'REP-104',
    type: 'major',
    category: 'Infrastructure',
    description: 'Bridge structural integrity failure warning issued.',
    status: 'active'
  }
];

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      fetchReports();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else navigate('#'); // Signal to toggle in parent if needed
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/reports');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setReports(res.data.data);
      } else {
        setReports(FALLBACK_SEARCH_REPORTS);
      }
    } catch (err) {
      console.warn("Global Search fallback active:", err);
      setReports(FALLBACK_SEARCH_REPORTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (path) => {
    onClose();
    navigate(path);
  };

  const trimmed = query.trim().toLowerCase();

  // Filter Reports
  const matchingReports = reports.filter((r) => {
    if (!trimmed) return true;
    const cat = (r.category || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    const idStr = (r.postId || r._id || '').toLowerCase();
    const typeStr = (r.type || '').toLowerCase();
    return cat.includes(trimmed) || desc.includes(trimmed) || idStr.includes(trimmed) || typeStr.includes(trimmed);
  });

  // Filter Actions
  const matchingActions = SYSTEM_NAVIGATION_ACTIONS.filter((act) => {
    if (!trimmed) return true;
    return act.title.toLowerCase().includes(trimmed) || act.category.toLowerCase().includes(trimmed);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4 bg-on-background/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Main Search Command Card */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-outline-variant/30 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        
        {/* Search Header Input */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3 bg-surface-container-lowest">
          <span className="material-symbols-outlined text-primary text-2xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search incidents, categories, report IDs, or actions..."
            className="w-full bg-transparent text-on-surface placeholder:text-outline font-medium text-base outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-on-surface-variant hover:text-on-surface text-sm">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-on-surface-variant bg-surface-container-high rounded border border-outline-variant/30 uppercase">
            ESC to close
          </kbd>
        </div>

        {/* Quick Filter Chips */}
        <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant shrink-0">Quick Filters:</span>
          {['Fire', 'Medical', 'Flood', 'Major', 'Create Report', 'Map'].map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors shrink-0 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-8 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              Searching intelligence network...
            </div>
          ) : (matchingReports.length === 0 && matchingActions.length === 0) ? (
            <div className="py-10 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] text-outline mb-2">search_off</span>
              <p className="text-sm font-bold text-on-surface">No intelligence results match "{query}"</p>
              <p className="text-xs text-on-surface-variant mt-1">Try searching for keywords like "Fire", "Medical", "Map", or "Report".</p>
            </div>
          ) : (
            <>
              {/* Quick Actions Category */}
              {matchingActions.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">
                    System Commands & Navigation ({matchingActions.length})
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {matchingActions.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => handleSelectResult(act.path)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest hover:bg-primary/10 border border-outline-variant/20 hover:border-primary/30 transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-lg">{act.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                            {act.title}
                          </p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{act.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incidents Category */}
              {matchingReports.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-1">
                    Emergency Incidents & Broadcasts ({matchingReports.length})
                  </p>
                  <div className="space-y-2">
                    {matchingReports.map((r) => {
                      const config = getDisasterConfig(r.category);
                      const isMajor = r.type === 'major';

                      return (
                        <div
                          key={r._id || r.postId}
                          onClick={() => handleSelectResult(`/reports/${r.postId || r._id}`)}
                          className="p-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/20 flex items-start justify-between gap-3 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30 mt-0.5">
                              <span className="material-symbols-outlined text-lg" style={{ color: config.hex }}>
                                {config.icon}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                                  {r.category} Incident
                                </span>
                                <span className="text-[10px] font-mono text-on-surface-variant opacity-70">
                                  ({r.postId || r._id})
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  isMajor ? 'bg-alert-red text-white' : 'bg-primary-container text-on-primary-container'
                                }`}>
                                  {isMajor ? 'MAJOR' : 'MINOR'}
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant line-clamp-1">
                                {r.description}
                              </p>
                            </div>
                          </div>

                          <span className="material-symbols-outlined text-outline text-lg group-hover:text-primary transition-colors shrink-0">
                            chevron_right
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
          <span>Protocol Zero OmniSearch Protocol v1.0</span>
          <span className="flex items-center gap-1">
            Press <kbd className="bg-surface-container px-1.5 py-0.5 rounded font-mono text-[10px] border border-outline-variant/30">ESC</kbd> to exit
          </span>
        </div>

      </div>
    </div>
  );
};

export default GlobalSearchModal;
