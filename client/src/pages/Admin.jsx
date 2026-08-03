import { useMemo, useState } from 'react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingApplications = useMemo(() => ([
    {
      id: 'APP-1042',
      name: 'Guardian Sierra',
      role: 'Reporter',
      nid: 'NID-8899012334',
      officeName: 'Metro News Bureau',
      officeAddress: '120 Media Lane, New York',
      submittedAt: '2026-08-03T08:25:00.000Z',
    },
    {
      id: 'APP-1098',
      name: 'Engine Delta 12',
      role: 'ResponseTeam',
      nid: 'NID-6677004411',
      officeName: 'Station 12 Command',
      officeAddress: '88 Harbor Drive, New York',
      submittedAt: '2026-08-03T09:14:00.000Z',
    },
    {
      id: 'APP-1104',
      name: 'North Medical Unit 3',
      role: 'ResponseTeam',
      nid: 'NID-4455127710',
      officeName: 'City Medical Response Hub',
      officeAddress: '41 Relief Avenue, New York',
      submittedAt: '2026-08-03T09:48:00.000Z',
    },
  ]), []);

  const flaggedAccounts = useMemo(() => ([
    {
      id: 'USR-2201',
      name: 'Nadia Akter',
      role: 'User',
      score: -52,
      falseReports: 7,
      lastActivity: '3 hrs ago',
    },
    {
      id: 'VLT-1108',
      name: 'Rescue Pulse',
      role: 'Volunteer',
      score: -41,
      falseReports: 4,
      lastActivity: '7 hrs ago',
    },
    {
      id: 'USR-2217',
      name: 'Ayaan Chowdhury',
      role: 'User',
      score: -68,
      falseReports: 9,
      lastActivity: '1 day ago',
    },
  ]), []);

  const escalatedReports = useMemo(() => ([
    {
      id: 'REP-8492',
      title: 'Major fire incident at 4th & King',
      author: 'Guardian Sierra',
      role: 'Reporter',
      upvotes: 1204,
      downvotes: 12,
      reliability: 'Suspicious',
      category: 'Fire',
    },
    {
      id: 'REP-8521',
      title: 'Suspicious flood warning near East Bay',
      author: 'North Relief Desk',
      role: 'Reporter',
      upvotes: 842,
      downvotes: 64,
      reliability: 'Suspicious',
      category: 'Flood',
    },
    {
      id: 'REP-8588',
      title: 'Traffic lane obstruction with unverified casualties',
      author: 'Metro Signal',
      role: 'Volunteer',
      upvotes: 433,
      downvotes: 91,
      reliability: 'Suspicious',
      category: 'Infrastructure',
    },
  ]), []);

  const tabs = [
    { id: 'pending', label: 'Pending Applications', count: pendingApplications.length },
    { id: 'flagged', label: 'Flagged Accounts', count: flaggedAccounts.length },
    { id: 'reports', label: 'Escalated Reports', count: escalatedReports.length },
  ];

  const handleAction = (label, payload) => {
    console.log(label, payload);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_40%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white/80 px-4 py-6 backdrop-blur xl:border-b-0 xl:border-r xl:border-slate-200">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_18px_60px_-35px_rgba(15,23,42,0.75)]">
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
              Review applications, audit flagged accounts, and process escalated reports from one control surface.
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
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${isActive ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">System status</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Queue health</span>
                <span className="font-medium text-emerald-600">Stable</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Verified reviewers</span>
                <span className="font-medium text-slate-900">12 online</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Escalations today</span>
                <span className="font-medium text-slate-900">8</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="max-w-5xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Admin console</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Moderation dashboard</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Static dummy view only. Actions are local console logs so the UI can be polished before integration.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current tab</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{tabs.find((tab) => tab.id === activeTab)?.label}</p>
              </div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.42)]">
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {pendingApplications.map((application) => (
                    <div key={application.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">{application.id}</span>
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">{application.role}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">{application.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">Submitted {new Date(application.submittedAt).toLocaleString()}</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">NID</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{application.nid}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Office Name</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{application.officeName}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Office Address</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{application.officeAddress}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 xl:flex-col xl:min-w-[180px]">
                          <button
                            type="button"
                            onClick={() => handleAction('Approve application', application)}
                            className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 xl:flex-none"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction('Reject application', application)}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 xl:flex-none"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'flagged' && (
                <div className="space-y-4">
                  {flaggedAccounts.map((account) => (
                    <div key={account.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">{account.id}</span>
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">Score {account.score}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-slate-950">{account.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">Role: {account.role} • False reports: {account.falseReports} • Last activity: {account.lastActivity}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAction('Review activity', account)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Review Activity
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {escalatedReports.map((report) => (
                    <div key={report.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">{report.id}</span>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">{report.reliability}</span>
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">{report.category}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-950">{report.title}</h3>
                          <p className="text-sm text-slate-500">Author: {report.author} • Role: {report.role} • Votes: +{report.upvotes} / -{report.downvotes}</p>
                        </div>

                        <div className="flex gap-3 xl:flex-col xl:min-w-[190px]">
                          <button
                            type="button"
                            onClick={() => handleAction('Restore report', report)}
                            className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 xl:flex-none"
                          >
                            Restore Report
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction('Confirm fake and close', report)}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 xl:flex-none"
                          >
                            Confirm Fake &amp; Close
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;