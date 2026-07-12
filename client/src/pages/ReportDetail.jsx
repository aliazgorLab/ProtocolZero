import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ReportDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-inverse-surface text-inverse-on-surface min-h-screen pb-32 text-base overflow-x-hidden">
      {/* Top Navigation (Shell Implementation) */}
      <header className="fixed top-0 w-full z-50 bg-on-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center px-4 h-14 w-full">
          <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-primary-fixed-dim">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-primary-fixed-dim">Report Details</h1>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-primary-fixed-dim">more_vert</span>
          </button>
        </div>
      </header>

      <main className="pt-14">
        {/* Hero Map Section */}
        <section className="relative h-[309px] w-full overflow-hidden bg-[#191b23]">
          <div 
            className="absolute inset-0 grayscale contrast-125 opacity-60 bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDf7p9T1-_X8OZmzoy7t7xeAKEbe-x5AGxCW2WUhfEfhxNRaPPWEmUU2qt4TfjdwA2CG7uEWzpdVtWeCJ53yxxRAsI1p6PFOOrt3MI8cRj23yACNUapVIMm0DxGpTm9hxvwfsswdRpf1p2BrWIEny0_BJIXfLF4f0Tmwg-wJaVUvYwmc2d7NGZ6EFfkcnwIisXsRZVv5NE7eo_tm8EK2b_47W0hrUgr9ZF9ox1WSwlSM-jYWN7Nrb_s')" }}
          ></div>
          
          {/* Animated Map Marker Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-alert-red rounded-full flex items-center justify-center sos-pulse shadow-2xl">
              <span className="material-symbols-outlined text-white text-3xl fill-icon">local_fire_department</span>
            </div>
          </div>
          
          {/* Location Badge */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim text-sm">location_on</span>
            <span className="text-xs font-medium text-white">4th & King St, Mission Bay</span>
          </div>
        </section>

        {/* Incident Header */}
        <section className="px-4 py-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-alert-red/20 border border-alert-red/30">
                <span className="w-2 h-2 rounded-full bg-alert-red"></span>
                <span className="text-xs font-bold text-alert-red uppercase tracking-widest">Extreme Priority</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">Major Fire Incident {id ? `#${id}` : ''}</h2>
            </div>
            
            {/* Reliability Progress Circle */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-white/5" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeWidth="4"></circle>
                  <circle className="text-emerald-500" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeDasharray="150.7" strokeDashoffset="30.1" strokeWidth="4"></circle>
                </svg>
                <span className="absolute font-bold text-sm text-white">94%</span>
              </div>
              <span className="text-[10px] font-medium text-outline-variant uppercase">Reliability</span>
            </div>
          </div>
          
          {/* Reliability Explanation */}
          <div className="bg-surface-container-low/10 border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="flex -space-x-3 shrink-0">
              <div className="w-8 h-8 rounded-full border-2 border-inverse-surface bg-primary" title="Response Team"></div>
              <div className="w-8 h-8 rounded-full border-2 border-inverse-surface bg-secondary-fixed-dim" title="Volunteer"></div>
              <div className="w-8 h-8 rounded-full border-2 border-inverse-surface bg-primary-container" title="Response Team"></div>
            </div>
            <p className="text-sm text-on-surface-variant">
              Verified by <span className="text-white font-bold">12 Response Team</span> members and 48 civilian observers.
            </p>
          </div>
        </section>

        {/* Image Gallery Carousel */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-bold text-outline-variant uppercase tracking-wider">Incident Gallery</h3>
            <span className="text-xs font-medium text-primary-fixed-dim">View All (6)</span>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 snap-x scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex-none w-72 h-48 rounded-xl overflow-hidden snap-start relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCVUkqHf_m40bAgumhgNkfxnnA8PPbAVXWDKBeNpFhIDKzd8PLniZX_NIh4LwguxXSale56TXM3WZQNlQBF8zE2RA2N7Yl5W3HYdbanzZDE0tbgNh6-Gk2UJuLd6_RVQoscBVEcLceRfr957dYli7h-8chy7g792U2XQz-fiyT4Saodo0VkV2vAY7K6bB1ncx66L-PWq-q5ZNtuBFXiJ3UF6SmHHl376Xok-zYM-Rq9l4DIhqNA8SEa')" }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span className="absolute bottom-3 left-3 text-xs font-medium text-white/80">3 mins ago</span>
            </div>
            <div className="flex-none w-72 h-48 rounded-xl overflow-hidden snap-start relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCi6Fy6qk49WEIJk5YZfgQt1R_4FMoFDn2a_UMZ6HNOF93KS1l4eXOX04vVXI_z_LY-3eHfIdQ4fq0cTqntU8oM1VEBYJJUhEHEGKI-ngs7ktsJmDMvT3KAmZ8rdA_jTLp5RID1auFDKXMfc8SV2qsD-FcEsX-wgz2a3OH91_ajGMMMHFhdBdbljLaocee_qXcAIUODCwCMpfoGskUCpBXuEcV8rWTrT6C6w52YJ5dM_XqYx2dP6Z53')" }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span className="absolute bottom-3 left-3 text-xs font-medium text-white/80">12 mins ago</span>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-xs font-bold text-outline-variant uppercase tracking-wider">Description</h3>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Large structure fire reported at the intersection of 4th and King. Witnesses report hearing multiple small explosions within the building's northern wing. SFFD is currently on-site with 4 units deployed. The area has been cordoned off within a 2-block radius. Residents are advised to keep windows closed due to heavy smoke inhalation risks. Status updated to 4-alarm as of 22:45 local time.
          </p>
        </section>

        {/* Vote Breakdown & Comments */}
        <section className="bg-surface-container-low/5 border-y border-white/5 py-6 px-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-outline-variant uppercase tracking-wider">Accuracy Verification</h3>
            <div className="flex items-center gap-4">
              <button className="flex items-center bg-primary/20 text-primary-fixed-dim rounded-lg px-3 py-1.5 gap-2 border border-primary/30 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-sm fill-icon">thumb_up</span>
                <span className="font-bold text-sm">1,204</span>
              </button>
              <button className="flex items-center bg-white/5 text-outline-variant rounded-lg px-3 py-1.5 gap-2 border border-white/10 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-sm">thumb_down</span>
                <span className="font-bold text-sm">12</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Updates & Intel</h4>
              <button className="text-xs font-medium text-primary-fixed-dim hover:underline">Add Report</button>
            </div>
            
            {/* Comment Thread */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold">G</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-bold">Guardian-1</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-white uppercase font-black tracking-wider">Response Team</span>
                  </div>
                  <p className="text-sm text-on-surface-variant italic">"Northern perimeter secured. Evacuation of adjacent building complete. No casualties reported in Sector 7."</p>
                  <span className="text-[10px] font-medium text-outline-variant">4 mins ago</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed-dim flex items-center justify-center flex-shrink-0 text-on-secondary-fixed font-bold">R</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-bold">Rescue-Ops</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-bold tracking-wider">Volunteer</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">"Setting up triage at 5th St. We have medical supplies if civilians need masks."</p>
                  <span className="text-[10px] font-medium text-outline-variant">15 mins ago</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Action Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-on-background/80 backdrop-blur-md border-t border-white/10 px-4 py-4 pb-safe pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-3 gap-4 h-12">
          <button className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 bg-primary-container text-on-primary-container rounded-xl font-bold active:scale-95 transition-all">
            <span className="material-symbols-outlined">directions</span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Navigate</span>
          </button>
          <button className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 bg-white/5 border border-white/10 text-white rounded-xl font-bold active:scale-95 transition-all">
            <span className="material-symbols-outlined">edit_note</span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Update</span>
          </button>
          <button className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 bg-white/5 border border-white/10 text-white rounded-xl font-bold active:scale-95 transition-all">
            <span className="material-symbols-outlined">share</span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Share</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ReportDetail;
