import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';

const ResponseTeamDash = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/reports');
        if (res.data?.data) {
          setReports(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch tactical reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const activeIncidents = reports.filter(r => r.status === 'active');

  return (
    <div className="bg-background text-on-surface flex flex-col h-screen overflow-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm flex justify-between items-center px-4 h-14">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">arrow_back</button>
          <h1 className="text-xl font-bold text-primary">Protocol Zero Command</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-error-container text-on-error-container px-3 py-1 rounded-full items-center gap-1 animate-pulse">
            <span className="material-symbols-outlined text-[16px] fill-icon">emergency</span>
            <span className="text-xs font-bold uppercase tracking-wider">{activeIncidents.length} ACTIVE INCIDENTS</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="mt-14 flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex flex-col h-full w-80 bg-surface-container-lowest shadow-xl py-6 px-4 z-40">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-container flex items-center justify-center font-bold text-primary">
              <span className="material-symbols-outlined text-2xl">local_police</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">{currentUser?.name || 'Response Officer'}</h3>
              <p className="text-xs font-medium text-on-surface-variant">{currentUser?.accountType || 'Response Team'}</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2">
            <Link to="/response-team/dashboard" className="bg-secondary-container text-on-secondary-container font-bold rounded-full px-4 py-3 flex items-center gap-4 active:opacity-80 transition-opacity">
              <span className="material-symbols-outlined fill-icon">dashboard</span>
              <span className="text-base">Control Deck</span>
            </Link>
            <Link to="/map" className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-high transition-colors rounded-full">
              <span className="material-symbols-outlined">map</span>
              <span className="text-base">Tactical Map</span>
            </Link>
            <Link to="/home" className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-high transition-colors rounded-full">
              <span className="material-symbols-outlined">rss_feed</span>
              <span className="text-base">Live Feed</span>
            </Link>
          </nav>
        </aside>

        {/* Tactical Status & Actions Section */}
        <section className="flex-1 relative bg-surface-dim p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Action Card */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Emergency Response Console</h2>
                <p className="text-sm text-on-surface-variant mt-1">Coordinate resources, view active incident telemetry, and commit units.</p>
              </div>
              <button 
                onClick={() => navigate('/map')}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all shrink-0"
              >
                OPEN TACTICAL MAP
              </button>
            </div>

            {/* Incidents Overview */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <h3 className="text-lg font-bold text-on-surface mb-4">Active Incident Dispatch List</h3>
              
              {loading ? (
                <div className="text-center py-8 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[32px] mb-2">progress_activity</span>
                  <p className="text-xs font-medium">Syncing active dispatches...</p>
                </div>
              ) : activeIncidents.length === 0 ? (
                <div className="text-center py-8 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">check_circle</span>
                  <p className="font-bold text-on-surface">No Active Emergency Dispatches</p>
                  <p className="text-xs text-on-surface-variant mt-1">All tactical sectors reporting clear.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeIncidents.map((incident) => (
                    <div 
                      key={incident._id || incident.postId}
                      className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            incident.type === 'major' ? 'bg-alert-red text-white' : 'bg-primary-container text-on-primary-container'
                          }`}>
                            {incident.type === 'major' ? 'MAJOR DISASTER' : 'MINOR'}
                          </span>
                          <span className="font-bold text-on-surface text-sm">{incident.category}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2">{incident.description}</p>
                      </div>

                      <button 
                        onClick={() => navigate(`/reports/${incident.postId || incident._id}`)}
                        className="bg-secondary text-white text-xs font-bold uppercase px-4 py-2 rounded-lg shrink-0 hover:bg-secondary/90"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Alert Queue Side Panel */}
        <section className="w-full md:w-[380px] bg-surface-container-low flex flex-col border-l border-outline-variant z-30">
          <div className="p-4 flex items-center justify-between border-b border-outline-variant">
            <h2 className="text-lg font-bold flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-alert-red fill-icon">notifications_active</span>
              Live Queue
            </h2>
            <span className="bg-surface-variant px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant">{reports.length} Total</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">inbox</span>
                <p className="text-xs font-medium">Queue empty.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div 
                  key={report._id || report.postId}
                  className="bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-primary p-3 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{report.category}</span>
                    <span className="text-[10px] text-on-surface-variant opacity-70">
                      {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface line-clamp-2 mb-3">{report.description}</p>
                  <button 
                    onClick={() => navigate(`/reports/${report.postId || report._id}`)}
                    className="bg-primary text-white w-full py-1.5 rounded text-[11px] font-bold uppercase tracking-wider"
                  >
                    View Report
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResponseTeamDash;
