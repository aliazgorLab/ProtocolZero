import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { updateUser } from '../features/auth/authSlice';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingVictim, setSubmittingVictim] = useState(false);

  useEffect(() => {
    const fetchReportDetail = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/reports/${id}`);
        if (res.data?.data) {
          setReport(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load report detail:", err);
        showToast("Could not load report details.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportDetail();
    }
  }, [id]);

  const handleVote = async (voteType) => {
    try {
      const res = await axiosInstance.patch(`/reports/${id}/vote`, { vote: voteType });
      if (res.data?.data) {
        setReport(res.data.data);
        showToast(`Vote recorded!`, "success");
      }
    } catch (err) {
      console.error("Failed to vote:", err);
      showToast(err.response?.data?.message || "Failed to submit vote.", "error");
    }
  };

  const handleCommentSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    try {
      setSubmittingComment(true);
      const res = await axiosInstance.post(`/reports/${id}/comment`, { text: trimmed });
      if (res.data?.data) {
        setReport(res.data.data);
        setCommentText('');
        showToast("Comment posted!", "success");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      showToast(err.response?.data?.message || "Failed to post comment.", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAttachVictim = async () => {
    setSubmittingVictim(true);

    const submitVictimPayload = async (payload) => {
      try {
        const res = await axiosInstance.post(`/reports/${id}/victim`, payload);
        if (res.data?.data) {
          setReport(res.data.data);
          dispatch(updateUser({ victimReportID: report._id }));
          showToast("You have been attached as a victim to this incident.", "success");
        }
      } catch (err) {
        console.error("Victim registration failed:", err);
        showToast(err.response?.data?.message || "Failed to attach as victim.", "error");
      } finally {
        setSubmittingVictim(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const payload = {
            gpsStatus: "success",
            gps: {
              type: "Point",
              coordinates: [pos.coords.longitude, pos.coords.latitude]
            }
          };
          submitVictimPayload(payload);
        },
        (err) => {
          console.warn("GPS acquire failed, attempting fallback:", err);
          submitVictimPayload({ gpsStatus: "failed" });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      submitVictimPayload({ gpsStatus: "failed" });
    }
  };

  const handleDetachVictim = async () => {
    try {
      setSubmittingVictim(true);
      const res = await axiosInstance.delete(`/reports/${id}/victim`);
      if (res.data?.data) {
        setReport(res.data.data);
        dispatch(updateUser({ victimReportID: null }));
        showToast("You have been marked safe and detached from this report.", "success");
      }
    } catch (err) {
      console.error("Failed to detach victim:", err);
      showToast(err.response?.data?.message || "Failed to detach from victim status.", "error");
    } finally {
      setSubmittingVictim(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-14 text-on-surface">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary mb-3">progress_activity</span>
        <p className="text-sm font-medium">Loading report telemetry...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-14 px-4 text-on-surface">
        <span className="material-symbols-outlined text-[64px] text-outline mb-3">error_med</span>
        <h2 className="text-xl font-bold">Report Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-1 mb-4">The requested report ID does not exist or has been removed.</p>
        <button onClick={handleBack} className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg">
          Return Back
        </button>
      </div>
    );
  }

  const isMajor = report.type === 'major';
  const upvotes = report.vote?.upvote || 0;
  const downvotes = report.vote?.downvote || 0;
  const netScore = upvotes - downvotes;

  const currentUserIdStr = currentUser?._id?.toString();
  const isAttachedToThisReport = Array.isArray(report.victims) && report.victims.some(v => {
    const vId = v.userId?._id ? v.userId._id.toString() : v.userId?.toString();
    return vId === currentUserIdStr;
  });

  const isAttachedToOtherReport = currentUser?.victimReportID && currentUser.victimReportID.toString() !== report._id?.toString();
  const isVettedResponder = ['Reporter', 'ResponseTeam', 'Admin', 'SuperAdmin'].includes(currentUser?.accountType);

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 pt-14">
      {/* Header */}
      <header className="sticky top-14 z-30 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface text-on-surface hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">INCIDENT TELEMETRY</p>
            <h1 className="text-base font-bold text-on-surface">{report.postId || report._id}</h1>
          </div>

          <div className="w-10"></div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <article className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-sm">
            {/* Header info banner */}
            <div className="p-6 bg-surface-container border-b border-outline-variant/30">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isMajor ? 'bg-alert-red text-white' : 'bg-primary-container text-on-primary-container'
                }`}>
                  {isMajor ? 'MAJOR DISASTER' : 'MINOR INCIDENT'}
                </span>
                <span className="rounded-full bg-surface-container-highest px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant border border-outline-variant/30">
                  {report.category}
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {report.status || 'Active'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-on-surface">{report.category} Report</h2>
              <p className="text-xs font-medium text-on-surface-variant mt-1">
                Reported {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Recently'}
              </p>
            </div>

            <div className="grid gap-6 p-6">
              {/* Issuer Profile Card */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center font-bold text-primary shrink-0">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-on-surface">{report.issuerId?.name || 'Anonymous Reporter'}</p>
                    <p className="text-xs text-on-surface-variant">{report.issuerId?.accountType || 'Citizen'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Net Score</p>
                  <div className="text-xl font-bold text-primary">{netScore}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Description</p>
                <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">{report.description}</p>
              </div>

              {/* Coordinates & Location */}
              {report.location?.coordinates && (
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Geospatial Coordinates</p>
                  <p className="text-sm font-mono text-primary font-bold">
                    Latitude: {report.location.coordinates[1]}, Longitude: {report.location.coordinates[0]}
                  </p>
                </div>
              )}

              {/* Voting Action Bar */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Community Verification</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleVote('upvote')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-600 transition hover:bg-emerald-500/20 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                    Upvote ({upvotes})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote('downvote')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-600 transition hover:bg-rose-500/20 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                    Downvote ({downvotes})
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Victim Registration & Rescue Roster Section */}
          <article className="rounded-3xl border border-alert-red/30 bg-surface p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-alert-red/10 text-alert-red flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">sos</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Victim & Emergency Support</h3>
                  <p className="text-xs text-on-surface-variant">Live telemetry and affected citizen attachment roster</p>
                </div>
              </div>
              <span className="rounded-full bg-alert-red/10 text-alert-red px-3 py-1 text-xs font-bold">
                {report.victims?.length || 0} Affected
              </span>
            </div>

            {/* Victim Status Action Box */}
            <div className="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              {isAttachedToThisReport ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
                    <div>
                      <p className="text-sm font-bold text-emerald-600">You Are Registered as a Victim</p>
                      <p className="text-xs text-on-surface-variant">Emergency responders have been alerted to your position.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submittingVictim}
                    onClick={handleDetachVictim}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {submittingVictim ? 'Processing...' : 'Mark Myself Safe'}
                  </button>
                </div>
              ) : isAttachedToOtherReport ? (
                <div className="flex items-center gap-3 text-amber-600">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                  <p className="text-xs font-semibold">You are currently registered as a victim on another active incident report.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-on-surface">Are you trapped or in immediate danger at this location?</p>
                    <p className="text-xs text-on-surface-variant">Attach yourself to send your live GPS and contact info directly to response teams.</p>
                  </div>
                  <button
                    type="button"
                    disabled={submittingVictim || report.status === 'closed'}
                    onClick={handleAttachVictim}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-alert-red px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-alert-red/90 active:scale-95 disabled:opacity-50 shrink-0 shadow-lg shadow-alert-red/20"
                  >
                    {submittingVictim ? 'Attaching...' : 'I Am A Victim (Attach Me)'}
                  </button>
                </div>
              )}
            </div>

            {/* Victim Roster */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Registered Victims Roster</p>
              {(!report.victims || report.victims.length === 0) ? (
                <p className="text-xs text-on-surface-variant text-center py-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
                  No victims currently registered on this report.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.victims.map((victim, idx) => {
                    const victimUser = victim.userId || {};
                    const gpsSuccess = victim.gpsStatus === 'success';

                    return (
                      <div key={victim._id || idx} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-alert-red/10 text-alert-red flex items-center justify-center font-bold">
                              <span className="material-symbols-outlined text-xl">person_pin</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">{victimUser.name || 'Victim'}</p>
                              <p className="text-xs text-on-surface-variant">{victimUser.accountType || 'Citizen'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              gpsSuccess ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}>
                              GPS: {victim.gpsStatus || 'Active'} {victim.gpsFallback ? '(Fallback)' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Extended Details for Vetted Responders */}
                        {isVettedResponder && (
                          <div className="mt-3 pt-3 border-t border-outline-variant/20 grid gap-2 sm:grid-cols-2 text-xs font-mono text-on-surface-variant">
                            <div>
                              <span className="font-bold text-on-surface">Phone:</span> {victimUser.phone || 'N/A'}
                            </div>
                            <div>
                              <span className="font-bold text-on-surface">Email:</span> {victimUser.email || 'N/A'}
                            </div>
                            {victimUser.gps?.coordinates && (
                              <div className="sm:col-span-2">
                                <span className="font-bold text-on-surface">Coordinates:</span> [{victimUser.gps.coordinates[1]}, {victimUser.gps.coordinates[0]}]
                              </div>
                            )}
                            {victimUser.homeAddress && (
                              <div className="sm:col-span-2">
                                <span className="font-bold text-on-surface">Home Address:</span> {victimUser.homeAddress}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          {/* Discussion Thread */}
          <article className="rounded-3xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Live Updates</p>
                <h3 className="text-lg font-bold text-on-surface">Discussion Thread</h3>
              </div>
              <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
                {report.comments?.length || 0}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Post a field update or message..."
                rows="3"
                className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline"
              />
              <button
                type="button"
                disabled={submittingComment}
                onClick={handleCommentSubmit}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary/90 active:scale-95 disabled:opacity-50"
              >
                {submittingComment ? 'Posting...' : 'Post Update'}
              </button>
            </div>

            <div className="space-y-3">
              {(!report.comments || report.comments.length === 0) ? (
                <p className="text-xs text-on-surface-variant text-center py-4">No comments posted yet.</p>
              ) : (
                report.comments.map((comment, index) => (
                  <div key={comment._id || index} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-on-surface">{comment.commenterId?.name || 'Responder'}</span>
                      <span className="text-[10px] text-on-surface-variant opacity-70">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </aside>
      </main>
    </div>
  );
};

export default ReportDetail;
