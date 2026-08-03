import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { logout } from '../features/auth/authSlice';

const Admin = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [escalatedReports, setEscalatedReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedPhoto, setSelectedPhoto] = useState(null); // URL for facial ID viewer
  const [rejectingUser, setRejectingUser] = useState(null); // User object for rejection modal
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const handleAdminSwitch = () => {
    dispatch(logout());
    showToast("Signed out. Redirecting to Admin Command Gateway...", "info");
    navigate('/admin/login');
  };

  const isAdmin = ['Admin', 'SuperAdmin'].includes(currentUser?.accountType);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [pendingRes, flaggedRes, escalatedRes] = await Promise.allSettled([
        axiosInstance.get('/admin/pending-users'),
        axiosInstance.get('/admin/flagged-users'),
        axiosInstance.get('/admin/escalated-reports')
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.data) {
        setPendingUsers(pendingRes.value.data.data);
      }
      if (flaggedRes.status === 'fulfilled' && flaggedRes.value.data?.data) {
        setFlaggedUsers(flaggedRes.value.data.data);
      }
      if (escalatedRes.status === 'fulfilled' && escalatedRes.value.data?.data) {
        setEscalatedReports(escalatedRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load admin telemetry:", err);
      showToast("Failed to load moderation data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-14 px-4 text-on-surface">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 max-w-md w-full text-center shadow-lg">
          <span className="material-symbols-outlined text-[64px] text-rose-600 mb-3">gavel</span>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
            The Administration Console is strictly reserved for verified <strong>Admin</strong> and <strong>SuperAdmin</strong> accounts. Your current logged-in role is <span className="font-bold text-rose-700 uppercase">{currentUser?.accountType || 'User'}</span>.
          </p>

          <button
            type="button"
            onClick={handleAdminSwitch}
            className="w-full py-3 px-5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out & Log In as Admin
          </button>
        </div>
      </div>
    );
  }

  // Action 1: Verify / Approve / Reject Applicant
  const handleVerifyUser = async (userId, status, reason = '') => {
    try {
      setProcessingAction(true);
      await axiosInstance.patch(`/admin/users/${userId}/verify`, {
        status,
        rejectionReason: reason
      });
      showToast(`User application marked as ${status.toUpperCase()}`, "success");
      setRejectingUser(null);
      setRejectionReason('');
      fetchAdminData();
    } catch (err) {
      console.error("Verification failed:", err);
      showToast(err.response?.data?.message || "Operation failed.", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  // Action 2: Reset User Reliability Score to 0
  const handleResetScore = async (userId) => {
    try {
      setProcessingAction(true);
      const res = await axiosInstance.patch(`/admin/users/${userId}/reset-score`);
      showToast(res.data?.message || "Reliability score reset to 0!", "success");
      fetchAdminData();
    } catch (err) {
      console.error("Score reset failed:", err);
      showToast(err.response?.data?.message || "Score reset failed.", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  // Action 3: Report Reliability Update (Mark Valid vs Confirm Fake & Close)
  const handleReportReliability = async (reportId, reliability) => {
    try {
      setProcessingAction(true);
      await axiosInstance.patch(`/admin/reports/${reportId}/reliability`, { reliability });
      showToast(
        reliability === 'valid'
          ? "Report restored to VALID and reactivated!"
          : "Report confirmed FAKE and closed.",
        reliability === 'valid' ? "success" : "info"
      );
      fetchAdminData();
    } catch (err) {
      console.error("Report reliability update failed:", err);
      showToast(err.response?.data?.message || "Operation failed.", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Applications', count: pendingUsers.length, icon: 'badge' },
    { id: 'flagged', label: 'Flagged Accounts', count: flaggedUsers.length, icon: 'warning' },
    { id: 'escalated', label: 'Escalated Reports', count: escalatedReports.length, icon: 'crisis_alert' },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_40%,_#f8fafc_100%)] text-slate-900 pt-14 pb-24">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[280px_1fr]">
        
        {/* Admin Navigation Sidebar */}
        <aside className="border-b border-slate-200 bg-white/80 px-4 py-6 backdrop-blur lg:border-b-0 lg:border-r lg:border-slate-200">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-rose-500">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">MODERATION CONSOLE</p>
                <h1 className="text-lg font-bold">Protocol Zero</h1>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/70">
              Audit vetted professional applications, manage low-trust accounts, and resolve community-flagged false incidents.
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
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition cursor-pointer ${
                    isActive 
                      ? 'border-slate-950 bg-slate-950 text-white shadow-lg' 
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-rose-500' : 'text-slate-500'}`}>
                      {tab.icon}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="max-w-5xl">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">ADMINISTRATION & COMPLIANCE</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 uppercase">
                  {activeTab === 'pending' && 'Pending Vetted Applications'}
                  {activeTab === 'flagged' && 'Low-Trust Flagged Accounts'}
                  {activeTab === 'escalated' && 'Escalated Community Reports'}
                </h2>
              </div>
              <button
                onClick={fetchAdminData}
                className="flex items-center gap-1.5 self-start md:self-auto text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh Telemetry
              </button>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {loading ? (
                <div className="text-center py-16 text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-[36px] mb-2 text-rose-500">progress_activity</span>
                  <p className="text-xs font-bold uppercase tracking-wider">Loading administrative records...</p>
                </div>
              ) : activeTab === 'pending' ? (
                /* TAB 1: PENDING APPLICATIONS */
                pendingUsers.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <span className="material-symbols-outlined text-5xl mb-2 text-emerald-500">verified_user</span>
                    <p className="font-bold text-slate-900 text-base">No Pending Applications</p>
                    <p className="text-xs mt-1">All professional reporter and response team credentials have been audited.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div key={user._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          
                          <div className="space-y-3 flex-grow">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                {user.accountType}
                              </span>
                              {user.role && (
                                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                                  Sub-Role: {user.role}
                                </span>
                              )}
                              <span className="rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                                Status: PENDING
                              </span>
                            </div>

                            <div>
                              <h3 className="text-lg font-bold text-slate-950">{user.name}</h3>
                              <p className="text-xs text-slate-600 font-medium">{user.email} • {user.phone || 'No phone provided'}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs text-slate-700">
                              <div>
                                <span className="font-bold text-slate-900">National ID (NID):</span> {user.nid || 'N/A'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900">Agency / Office:</span> {user.officeName || 'N/A'}
                              </div>
                              <div className="sm:col-span-2">
                                <span className="font-bold text-slate-900">Office Address:</span> {user.officeAddress || 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Facial Verification Thumbnail & Action Buttons */}
                          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                            {user.face && (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto(user.face)}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-primary text-xs font-bold text-primary transition cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">visibility</span>
                                View Facial ID Photo
                              </button>
                            )}

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                disabled={processingAction}
                                onClick={() => handleVerifyUser(user._id, 'verified')}
                                className="flex-1 sm:flex-initial rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={processingAction}
                                onClick={() => setRejectingUser(user)}
                                className="flex-1 sm:flex-initial rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'flagged' ? (
                /* TAB 2: FLAGGED ACCOUNTS */
                flaggedUsers.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <span className="material-symbols-outlined text-5xl mb-2 text-emerald-500">gavel</span>
                    <p className="font-bold text-slate-900 text-base">No Flagged Accounts</p>
                    <p className="text-xs mt-1">All user accounts possess high reliability scores above the -40 threshold.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedUsers.map((user) => (
                      <div key={user._id} className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="rounded-full bg-rose-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                SCORE: {user.score}
                              </span>
                              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                                Flagged for Low Reliability
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-950">{user.name}</h3>
                            <p className="text-xs text-slate-600">{user.email} • {user.phone || 'No phone'} • Account Type: {user.accountType}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={processingAction}
                              onClick={() => handleResetScore(user._id)}
                              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                            >
                              Reset Score to 0
                            </button>
                            <button
                              type="button"
                              disabled={processingAction}
                              onClick={() => handleVerifyUser(user._id, 'rejected', 'Account suspended due to low reliability score.')}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                            >
                              Suspend Account
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* TAB 3: ESCALATED REPORTS */
                escalatedReports.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <span className="material-symbols-outlined text-5xl mb-2 text-emerald-500">task_alt</span>
                    <p className="font-bold text-slate-900 text-base">No Escalated Incident Reports</p>
                    <p className="text-xs mt-1">No community reports are currently flagged as false or suspicious.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {escalatedReports.map((report) => {
                      const upvotes = report.vote?.upvote || 0;
                      const downvotes = report.vote?.downvote || 0;
                      const author = report.issuerId || {};
                      const commentsList = report.comments || [];

                      return (
                        <div key={report._id || report.postId} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3 flex-grow">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                  FLAGGED SUSPICIOUS / FALSE
                                </span>
                                <span className="text-xs font-mono text-slate-500 font-bold">
                                  ID: {report.postId || report._id}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-slate-950">{report.category} Report</h3>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">{report.description}</p>

                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-amber-200/60 font-medium">
                                <span>Author: <strong className="text-slate-900">{author.name || 'Citizen'}</strong> ({author.accountType || 'User'})</span>
                                <span>Upvotes: <strong className="text-emerald-600 font-bold">{upvotes}</strong></span>
                                <span>Downvotes: <strong className="text-rose-600 font-bold">{downvotes}</strong></span>
                              </div>

                              {/* Downvote Comments Thread Section */}
                              {commentsList.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-amber-200/60">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                    Community Comments ({commentsList.length})
                                  </p>
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                    {commentsList.map((c, cIdx) => (
                                      <div key={c._id || cIdx} className="bg-white/80 p-2 rounded-lg border border-amber-200/50 text-xs">
                                        <span className="font-bold text-slate-900">{c.commenterId?.name || 'Citizen'}: </span>
                                        <span className="text-slate-700">{c.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={processingAction}
                                onClick={() => handleReportReliability(report._id || report.postId, 'valid')}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm text-center"
                              >
                                Restore Report (Valid)
                              </button>
                              <button
                                type="button"
                                disabled={processingAction}
                                onClick={() => handleReportReliability(report._id || report.postId, 'false')}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer text-center"
                              >
                                Confirm Fake & Close
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </section>
          </div>
        </main>
      </div>

      {/* MODAL 1: Facial ID Image Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-950">Facial Verification / ID Photo Inspection</h3>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center p-2">
              <img
                src={selectedPhoto}
                alt="Facial Verification ID"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rejection Reason Input Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-950">Reject Application</h3>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              You are rejecting the application for <strong className="text-slate-900">{rejectingUser.name}</strong> ({rejectingUser.accountType}).
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter optional rejection reason (e.g. Invalid NID or unreadable ID photo)..."
              rows="3"
              className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-rose-500 mb-4 resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={() => handleVerifyUser(rejectingUser._id, 'rejected', rejectionReason)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;