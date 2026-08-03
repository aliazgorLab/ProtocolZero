import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReportDetail = () => {
  const currentUserRole = 'User';
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [voteState, setVoteState] = useState({ upvote: 1204, downvote: 12 });
  const [commentFeed, setCommentFeed] = useState([]);

  const report = useMemo(() => ({
    _id: '66a8f2c8a7f4a00123b4d901',
    postId: 'REP-8492',
    issuerId: {
      _id: '66a8f2c8a7f4a00123b4d111',
      name: 'Guardian Sierra',
      phone: '+8801717000000',
      email: 'sierra.reporter@protocolzero.test',
      accountType: 'Reporter',
      verificationStatus: 'verified',
      face: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
      role: 'Reporter',
    },
    updaterId: {
      _id: '66a8f2c8a7f4a00123b4d112',
      name: 'Response Delta',
      accountType: 'ResponseTeam',
    },
    closedBy: null,
    closedAt: null,
    type: 'major',
    location: {
      type: 'Point',
      coordinates: [-73.9721, 40.7632],
    },
    impactAreas: [
      { coordinate: { type: 'Point', coordinates: [-73.9732, 40.7641] }, radius: 250 },
      { coordinate: { type: 'Point', coordinates: [-73.9697, 40.7622] }, radius: 180 },
    ],
    time: '2026-08-03T10:40:00.000Z',
    category: 'fire',
    description:
      'Large structure fire reported at the intersection of 4th and King. Witnesses reported multiple bursts from the north wing. Response units are on site and the surrounding block radius is being evacuated.',
    image: [
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    ],
    victims: [
      {
        userId: {
          _id: '66a8f2c8a7f4a00123b4d201',
          name: 'Maya Rahman',
          phone: '+8801717000001',
          email: 'maya@example.test',
          homeAddress: '45 Madison Ave, New York, NY',
          face: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
        },
        gpsStatus: 'success',
        gpsFallback: false,
      },
      {
        userId: {
          _id: '66a8f2c8a7f4a00123b4d202',
          name: 'Ayaan Chowdhury',
          phone: '+8801717000002',
          email: 'ayaan@example.test',
          homeAddress: '71 5th Ave, New York, NY',
          face: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
        },
        gpsStatus: 'failed',
        gpsFallback: true,
      },
      {
        userId: {
          _id: '66a8f2c8a7f4a00123b4d203',
          name: 'Nadia Akter',
          phone: '+8801717000003',
          email: 'nadia@example.test',
          homeAddress: '12 Hudson St, New York, NY',
          face: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80',
        },
        gpsStatus: 'success',
        gpsFallback: false,
      },
    ],
    resourcesNeeded: [
      { itemName: 'Water Bottles', quantity: 240, unit: 'units' },
      { itemName: 'N95 Masks', quantity: 180, unit: 'units' },
      { itemName: 'Medical Kits', quantity: 16, unit: 'packs' },
    ],
    resourcesCommitted: [
      {
        providerId: {
          _id: '66a8f2c8a7f4a00123b4d301',
          name: 'Engine 12',
          accountType: 'ResponseTeam',
          role: 'firefighter',
        },
        itemName: 'Water Hose Units',
        quantity: 4,
        unit: 'sets',
        createdAt: '2026-08-03T10:55:00.000Z',
        location: { type: 'Point', coordinates: [-73.9728, 40.7637] },
      },
      {
        providerId: {
          _id: '66a8f2c8a7f4a00123b4d302',
          name: 'Metro Medical 3',
          accountType: 'ResponseTeam',
          role: 'civilsurgeon',
        },
        itemName: 'Triage Supplies',
        quantity: 8,
        unit: 'boxes',
        createdAt: '2026-08-03T11:02:00.000Z',
        location: { type: 'Point', coordinates: [-73.9709, 40.7627] },
      },
    ],
    vote: {
      upvote: 1204,
      downvote: 12,
      upvoterId: [
        '66a8f2c8a7f4a00123b4d401',
        '66a8f2c8a7f4a00123b4d402',
      ],
      downvoterId: ['66a8f2c8a7f4a00123b4d403'],
    },
    reliability: 'valid',
    status: 'active',
    comments: [
      {
        text: 'Northern perimeter secured. Evacuation of adjacent building complete.',
        commenterId: {
          _id: '66a8f2c8a7f4a00123b4d501',
          name: 'Guardian-1',
          accountType: 'ResponseTeam',
        },
        createdAt: '2026-08-03T10:44:00.000Z',
      },
      {
        text: 'Setting up triage at 5th St. We have medical supplies if civilians need masks.',
        commenterId: {
          _id: '66a8f2c8a7f4a00123b4d502',
          name: 'Rescue-Ops',
          accountType: 'Volunteer',
        },
        createdAt: '2026-08-03T10:48:00.000Z',
      },
    ],
    editHistory: [
      {
        editorId: {
          _id: '66a8f2c8a7f4a00123b4d601',
          name: 'Guardian Sierra',
        },
        editedAt: '2026-08-03T10:52:00.000Z',
        previousState: { description: 'Initial report submitted with basic location and smoke visibility.' },
      },
    ],
  }), []);

  const typeBadge = report.type === 'major'
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-slate-100 text-slate-700 border-slate-200';

  const statusBadge = report.status === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-zinc-100 text-zinc-700 border-zinc-200';

  const reliabilityBadge = {
    valid: 'bg-sky-50 text-sky-700 border-sky-200',
    false: 'bg-rose-50 text-rose-700 border-rose-200',
    none: 'bg-slate-100 text-slate-700 border-slate-200',
  }[report.reliability];

  const visibleVictimFields = (victim) => {
    const user = victim.userId;

    if (currentUserRole === 'User') {
      return (
        <div className="flex items-center gap-4">
          <img
            src={user.face}
            alt={user.name}
            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
          />
          <div>
            <p className="font-medium text-slate-950">{user.name}</p>
            <p className="text-sm text-slate-500">Civilian victim record</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user.face}
              alt={user.name}
              className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
            />
            <div>
              <p className="font-medium text-slate-950">{user.name}</p>
              <p className="text-sm text-slate-500">{user.phone}</p>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${victim.gpsStatus === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            Live GPS
          </span>
        </div>
        <p className="text-sm text-slate-500">{user.homeAddress}</p>
      </div>
    );
  };

  const handleCommentSubmit = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setCommentFeed((previous) => ([
      {
        text: trimmed,
        commenterId: {
          _id: 'dummy-current-user',
          name: 'You',
          accountType: currentUserRole,
        },
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ]));
    setCommentText('');
    console.log('Dummy comment posted');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const comments = [...commentFeed, ...report.comments];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_36%,_#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <button
            onClick={handleBack}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>

          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Report detail</p>
            <h1 className="text-lg font-semibold text-slate-950">Protocol Zero</h1>
          </div>

          <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_-42px_rgba(15,23,42,0.42)]">
            <div className="relative h-[320px] bg-slate-100">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524230572899-a752b3835842?auto=format&fit=crop&w=1600&q=80')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${typeBadge}`}>Major</span>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusBadge}`}>Active</span>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${reliabilityBadge}`}>Reliable</span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-3 text-white md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">Post ID {report.postId}</p>
                  <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">Major Fire Incident at 4th & King</h2>
                  <p className="mt-2 text-sm text-white/80">{new Date(report.time).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">Location</p>
                  <p className="mt-1 text-sm font-medium text-white">40.7632, -73.9721</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Issuer</p>
                  <div className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <img
                      src={report.issuerId.face}
                      alt={report.issuerId.name}
                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{report.issuerId.name}</p>
                      <p className="text-sm text-slate-500">{report.issuerId.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">Reporter</span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Vote Score</p>
                  <div className="mt-3 text-3xl font-semibold text-slate-950">{voteState.upvote - voteState.downvote}</div>
                  <p className="mt-1 text-sm text-slate-500">Virtual score from the vote object</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Leaflet map placeholder</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">Incident location canvas</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">2dsphere location</span>
                </div>
                <div className="mt-4 h-64 rounded-3xl border border-dashed border-slate-300 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(135deg,_#ffffff,_#eef2ff)]" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {report.image.map((image, index) => (
                  <div key={image} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img src={image} alt={`Incident evidence ${index + 1}`} className="h-44 w-full object-cover" />
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Description</p>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{report.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Action bar</p>
                  <span className="text-xs text-slate-500">Dummy counters only</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setVoteState((previous) => ({ ...previous, upvote: previous.upvote + 1 }))}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                    Upvote {voteState.upvote}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteState((previous) => ({ ...previous, downvote: previous.downvote + 1 }))}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                    Downvote {voteState.downvote}
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.42)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Victims</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">Registered victim list</h3>
              </div>
              <button
                type="button"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                I Am A Victim (Attach Me)
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {report.victims.map((victim) => (
                <div key={victim.userId._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {visibleVictimFields(victim)}
                </div>
              ))}
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.42)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Logistics</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Resources</h3>

            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-950">Resources Needed</h4>
                <div className="mt-3 space-y-3">
                  {report.resourcesNeeded.map((resource) => (
                    <div key={resource.itemName} className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                      <div>
                        <p className="font-medium text-slate-950">{resource.itemName}</p>
                        <p className="text-sm text-slate-500">Requested by report author</p>
                      </div>
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        {resource.quantity} {resource.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-950">Official Resources Committed</h4>
                <div className="mt-3 space-y-3">
                  {report.resourcesCommitted.map((resource) => (
                    <div key={`${resource.itemName}-${resource.createdAt}`} className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-950">{resource.itemName}</p>
                          <p className="text-sm text-slate-500">Provider: {resource.providerId.name}</p>
                        </div>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                          {resource.quantity} {resource.unit}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Location: {resource.location.coordinates.join(', ')}</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(resource.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.42)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Comments</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">Discussion thread</h3>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{comments.length} posts</span>
            </div>

            <div className="mt-5 space-y-4">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment or update..."
                rows="4"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
              <button
                type="button"
                onClick={handleCommentSubmit}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Post Comment
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {comments.map((comment, index) => (
                <div key={`${comment.commenterId.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-950">{comment.commenterId.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{comment.commenterId.accountType}</p>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{comment.text}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </main>
    </div>
  );
};

export default ReportDetail;
