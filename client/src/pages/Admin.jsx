import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [pendingRes, flaggedRes] = await Promise.allSettled([
        axiosInstance.get('/admin/pending-users'),
        axiosInstance.get('/admin/flagged-users')
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.data) {
        setPendingUsers(pendingRes.value.data.data);
      }
      if (flaggedRes.status === 'fulfilled' && flaggedRes.value.data?.data) {
        setFlaggedUsers(flaggedRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load admin telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyUser = async (userId, status) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/verify`, { status });
      showToast(`User status updated to ${status}`, "success");
      fetchAdminData();
    } catch (err) {
      console.error("Verification failed:", err);
      showToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Applications', count: pendingUsers.length },
    { id: 'flagged', label: 'Flagged Accounts', count: flaggedUsers.length },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_40%,_#f8fafc_100%)] text-slate-900 pt-14">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white/80 px-4 py-6 backdrop-blur xl:border-b-0 xl:border-r xl:border-slate-200">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <span className="material-symbols-outlined">admin_panel_settings</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Moderation</p>
                <h1 className="text-lg font-semibold">Protocol Zero</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Review official applications and audit flagged account security scores.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                    isActive ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="max-w-5xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Admin Console</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">System Administration</h2>
              </div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {loading ? (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-[36px] mb-2">progress_activity</span>
                  <p className="text-xs font-medium">Loading administrative records...</p>
                </div>
              ) : activeTab === 'pending' ? (
                pendingUsers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">verified_user</span>
                    <p className="font-bold text-slate-900">No Pending Applications</p>
                    <p className="text-xs mt-1">All applicant credentials have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div key={user._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                                {user.accountType}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-950">{user.name}</h3>
                              <p className="mt-1 text-sm text-slate-500">{user.email} • {user.phoneNumber || 'No phone'}</p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleVerifyUser(user._id, 'verified')}
                              className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyUser(user._id, 'rejected')}
                              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                flaggedUsers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">gavel</span>
                    <p className="font-bold text-slate-900">No Flagged Accounts</p>
                    <p className="text-xs mt-1">No user accounts are currently below reliability threshold.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedUsers.map((user) => (
                      <div key={user._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">
                              Score {user.score}
                            </span>
                            <h3 className="mt-2 text-lg font-semibold text-slate-950">{user.name}</h3>
                            <p className="text-xs text-slate-500">{user.email} • Role: {user.accountType}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;