import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import { updateUser } from '../features/auth/authSlice';
import { RESOURCE_TAXONOMY } from '../constants/resources';

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

  // Asset Commitment State for ResponseTeam
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [selectedCommitItem, setSelectedCommitItem] = useState(RESOURCE_TAXONOMY[0].id);
  const [commitQuantity, setCommitQuantity] = useState(1);
  const [submittingCommitment, setSubmittingCommitment] = useState(false);

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
    if (report?.status === 'closed') {
      showToast("Cannot vote on a closed report.", "warning");
      return;
    }

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
    if (report?.status === 'closed') {
      showToast("Cannot comment on a closed report.", "warning");
      return;
    }

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
    if (report?.status === 'closed') {
      showToast("Cannot register as victim on a closed report.", "warning");
      return;
    }

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

  const userInventory = Array.isArray(currentUser?.inventory) ? currentUser.inventory.filter(i => i.quantity > 0) : [];
  const selectedInvItem = userInventory.find(i => (i.itemId || i.id) === selectedCommitItem || i.itemName === selectedCommitItem) || userInventory[0];
  const maxAvailableQty = selectedInvItem ? selectedInvItem.quantity : 0;

  useEffect(() => {
    if (userInventory.length > 0 && (!selectedCommitItem || !userInventory.some(i => (i.itemId || i.id) === selectedCommitItem || i.itemName === selectedCommitItem))) {
      const firstItem = userInventory[0];
      setSelectedCommitItem(firstItem.itemId || firstItem.id || firstItem.itemName);
    }
  }, [currentUser]);

  const handleCommitResourceSubmit = async (e) => {
    e.preventDefault();
    if (report?.status === 'closed') {
      showToast("Cannot commit assets to a closed report.", "warning");
      return;
    }

    if (userInventory.length === 0) {
      showToast("You have no items in your inventory stock. Please update your stock in your User Profile first.", "warning");
      return;
    }

    if (!selectedInvItem) {
      showToast("Please select a valid inventory item.", "warning");
      return;
    }

    if (commitQuantity <= 0) {
      showToast("Quantity must be at least 1.", "warning");
      return;
    }

    if (commitQuantity > maxAvailableQty) {
      showToast(`Insufficient stock! You only have ${maxAvailableQty} ${selectedInvItem.itemName || 'item'}(s) in your inventory stock.`, "warning");
      return;
    }

    try {
      setSubmittingCommitment(true);
      const taxMatch = RESOURCE_TAXONOMY.find(t => t.id === (selectedInvItem.itemId || selectedInvItem.id) || t.name === selectedInvItem.itemName) || {};
      const canonicalItemId = taxMatch.id || selectedInvItem.itemId || selectedInvItem.id || selectedInvItem.itemName;

      const payload = {
        items: [
          {
            itemId: canonicalItemId,
            quantity: Number(commitQuantity),
          }
        ]
      };

      const res = await axiosInstance.patch(`/reports/${id}/resources`, payload);
      if (res.data?.data) {
        setReport(prev => ({ ...prev, resourcesCommitted: res.data.data }));

        // Deduct inventory stock locally in Redux
        const updatedInv = userInventory.map(item => {
          const isMatch = (item.itemId || item.id) === (selectedInvItem.itemId || selectedInvItem.id) || item.itemName === selectedInvItem.itemName;
          if (isMatch) {
            return { ...item, quantity: item.quantity - Number(commitQuantity) };
          }
          return item;
        }).filter(item => item.quantity > 0);

        dispatch(updateUser({ inventory: updatedInv }));

        setShowCommitModal(false);
        showToast(`Committed ${commitQuantity} x ${taxMatch.name || selectedInvItem.itemName} from inventory!`, "success");
      }
    } catch (err) {
      console.error("Failed to commit asset:", err);
      showToast(err.response?.data?.message || "Failed to commit asset.", "error");
    } finally {
      setSubmittingCommitment(false);
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
        <button onClick={handleBack} className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
          Return Back
        </button>
      </div>
    );
  }

  const isMajor = report.type === 'major';
  const isClosed = report.status === 'closed';
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
  const isResponseTeam = currentUser?.accountType === 'ResponseTeam';

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 pt-14">
      {/* Header */}
      <header className="sticky top-14 z-30 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface text-on-surface hover:bg-surface-container transition cursor-pointer"
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
          
          {/* Prominent Banner for Closed Reports */}
          {isClosed && (
            <div className="rounded-2xl bg-slate-900 text-slate-100 p-4 flex items-center gap-3 border border-slate-700 shadow-md animate-in fade-in duration-300">
              <span className="material-symbols-outlined text-rose-400 text-3xl shrink-0">block</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-400">INCIDENT REPORT CLOSED & INACTIVE</p>
                <p className="text-xs text-slate-300 mt-0.5 font-medium leading-relaxed">
                  This report has been permanently closed (resolved or flagged as false). Voting, commenting, victim registration, and responder asset commitments are disabled.
                </p>
              </div>
            </div>
          )}

          <article className={`overflow-hidden rounded-3xl border shadow-sm ${
            isClosed ? 'border-slate-300 bg-slate-50/60' : 'border-outline-variant/30 bg-surface'
          }`}>
            {/* Header info banner */}
            <div className="p-6 bg-surface-container border-b border-outline-variant/30">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isClosed ? 'bg-slate-700 text-white' : isMajor ? 'bg-alert-red text-white' : 'bg-primary-container text-on-primary-container'
                }`}>
                  {isClosed ? 'CLOSED REPORT' : isMajor ? 'MAJOR DISASTER' : 'MINOR INCIDENT'}
                </span>
                <span className="rounded-full bg-surface-container-highest px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant border border-outline-variant/30">
                  {report.category}
                </span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                  isClosed 
                    ? 'bg-slate-800 text-slate-100 border-slate-700' 
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}>
                  {isClosed ? 'CLOSED / RESOLVED' : (report.status || 'Active')}
                </span>
              </div>

              <h2 className={`text-2xl font-bold ${isClosed ? 'text-slate-600 line-through' : 'text-on-surface'}`}>
                {report.category} Report
              </h2>
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
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Community Verification {isClosed && '(Disabled - Report Closed)'}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isClosed}
                    onClick={() => handleVote('upvote')}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-bold transition active:scale-95 ${
                      isClosed 
                        ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                    Upvote ({upvotes})
                  </button>
                  <button
                    type="button"
                    disabled={isClosed}
                    onClick={() => handleVote('downvote')}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-bold transition active:scale-95 ${
                      isClosed 
                        ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                    Downvote ({downvotes})
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Required Supplies Taxonomy Card */}
          <article className="rounded-3xl border border-primary/30 bg-surface p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">inventory_2</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Required Emergency Supplies</h3>
                  <p className="text-xs text-on-surface-variant">Standardized resource catalog items requested for this site</p>
                </div>
              </div>
            </div>

            {(!report.resourcesNeeded || report.resourcesNeeded.length === 0) ? (
              <p className="text-xs text-on-surface-variant text-center py-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 italic">
                No specific supplies requested for this incident.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {report.resourcesNeeded.map((resItem, idx) => {
                  const tax = RESOURCE_TAXONOMY.find(t => t.id === (resItem.itemId || resItem.id)) || {};
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl border border-primary/20 bg-surface-container-lowest flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {resItem.category || tax.category || 'Supplies'}
                        </span>
                        <h4 className="text-sm font-bold text-on-surface mt-1">{resItem.itemName || tax.name || 'Resource Item'}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-primary">{resItem.quantity}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant block uppercase tracking-wider">{resItem.unit || tax.defaultUnit || 'units'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          {/* Official Assets Committed Panel (Response Team Logistics) */}
          <article className="rounded-3xl border border-emerald-500/30 bg-surface p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">local_shipping</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Official Assets Committed</h3>
                  <p className="text-xs text-on-surface-variant">Response Team vehicles and heavy equipment deployed to scene</p>
                </div>
              </div>

              {isResponseTeam && !isClosed && (
                <button
                  type="button"
                  onClick={() => setShowCommitModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Commit Asset
                </button>
              )}
            </div>

            {(!report.resourcesCommitted || report.resourcesCommitted.length === 0) ? (
              <p className="text-xs text-on-surface-variant text-center py-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 italic">
                No official response assets committed yet.
              </p>
            ) : (
              <div className="space-y-3">
                {report.resourcesCommitted.map((committed, idx) => {
                  const tax = RESOURCE_TAXONOMY.find(t => t.id === (committed.itemId || committed.id) || t.name === committed.itemName) || {};
                  return (
                    <div key={committed._id || committed.itemId || idx} className="p-4 rounded-2xl border border-emerald-500/20 bg-surface-container-lowest flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                          <span className="material-symbols-outlined text-xl">shield</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-on-surface">{committed.itemName || tax.name}</h4>
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded uppercase">
                              {committed.quantity} {committed.unit || tax.defaultUnit}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Provider: <span className="font-bold text-on-surface">{committed.providerId?.name || 'Response Unit'}</span> • {committed.createdAt ? new Date(committed.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Deployed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
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
                    disabled={submittingVictim || isClosed}
                    onClick={handleAttachVictim}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition shrink-0 ${
                      isClosed 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-alert-red hover:bg-alert-red/90 active:scale-95 cursor-pointer shadow-lg shadow-alert-red/20'
                    }`}
                  >
                    {isClosed ? 'Report Closed' : submittingVictim ? 'Attaching...' : 'I Am A Victim (Attach Me)'}
                  </button>
                </div>
              )}
            </div>

            {/* Victim Roster */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Registered Victims Roster</p>
              {(!report.victims || report.victims.length === 0) ? (
                <p className="text-xs text-on-surface-variant text-center py-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 italic">
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
                disabled={isClosed}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isClosed ? "Comments disabled for closed reports." : "Post a field update or message..."}
                rows="3"
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                  isClosed 
                    ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed placeholder:text-slate-400' 
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 focus:ring-2 focus:ring-primary placeholder:text-outline'
                }`}
              />
              <button
                type="button"
                disabled={submittingComment || isClosed}
                onClick={handleCommentSubmit}
                className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition ${
                  isClosed ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 active:scale-95 cursor-pointer'
                }`}
              >
                {isClosed ? 'Comments Disabled' : submittingComment ? 'Posting...' : 'Post Update'}
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

      {/* ResponseTeam Commit Asset Modal */}
      {showCommitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl border border-outline-variant/30 p-6 max-w-md w-full shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">local_shipping</span>
                <h3 className="text-lg font-bold text-on-surface">Commit Official Asset</h3>
              </div>
              <button 
                onClick={() => setShowCommitModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {userInventory.length === 0 ? (
              <div className="py-6 px-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
                <span className="material-symbols-outlined text-amber-500 text-4xl">inventory_2</span>
                <p className="text-xs font-bold text-on-surface">No Available Items in Inventory</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  You currently have no stock available in your user inventory. Please add items under your <strong>User Profile</strong> before committing assets to incidents.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCommitModal(false);
                    navigate('/profile');
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded-xl hover:bg-primary/90 transition cursor-pointer"
                >
                  Go To Profile Inventory
                </button>
              </div>
            ) : (
              <form onSubmit={handleCommitResourceSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    Select Available Inventory Stock Item
                  </label>
                  <select
                    value={selectedCommitItem}
                    onChange={(e) => {
                      setSelectedCommitItem(e.target.value);
                      const sel = userInventory.find(i => (i.itemId || i.id) === e.target.value || i.itemName === e.target.value);
                      if (sel && commitQuantity > sel.quantity) {
                        setCommitQuantity(sel.quantity);
                      }
                    }}
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs font-bold text-on-surface outline-none focus:border-primary cursor-pointer"
                  >
                    {userInventory.map(item => {
                      const tax = RESOURCE_TAXONOMY.find(t => t.id === (item.itemId || item.id) || t.name === item.itemName) || {};
                      const cat = tax.category || item.category || 'Supplies';
                      const name = tax.name || item.itemName || 'Resource Item';
                      const val = item.itemId || item.id || item.itemName;
                      return (
                        <option key={val} value={val}>
                          [{cat}] {name} — (Stock: {item.quantity} {item.unit || tax.defaultUnit || 'units'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Deployment Quantity
                    </label>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Available Stock: {maxAvailableQty} {selectedInvItem?.unit || 'units'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={maxAvailableQty}
                    value={commitQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setCommitQuantity(Math.min(maxAvailableQty, Math.max(1, val)));
                    }}
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-sm font-bold text-on-surface outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
                    You cannot enter a quantity greater than your available stock ({maxAvailableQty}).
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCommitModal(false)}
                    className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-xs font-bold uppercase tracking-wider hover:bg-surface-container transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCommitment || maxAvailableQty === 0}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {submittingCommitment ? 'Deploying...' : 'Deploy Asset'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;
