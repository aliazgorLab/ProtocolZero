import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const roles = [
  {
    id: 'citizen',
    title: 'Citizen',
    description: 'Standard access. Receive localized alerts and view verified safety resources in your area.',
    icon: 'person',
    iconBgClass: 'bg-surface-container-high',
    iconTextClass: 'text-primary',
  },
  {
    id: 'reporter',
    title: 'Reporter',
    description: 'Active monitoring. Submit incident reports, upload evidence, and verify situational status.',
    icon: 'campaign',
    iconBgClass: 'bg-secondary-fixed',
    iconTextClass: 'text-on-secondary-fixed-variant',
  },
  {
    id: 'volunteer',
    title: 'Volunteer',
    description: 'Direct assistance. Provide mutual aid, logistics support, and community coordination during crises.',
    icon: 'volunteer_activism',
    iconBgClass: 'bg-tertiary-fixed',
    iconTextClass: 'text-tertiary',
  },
  {
    id: 'response',
    title: 'Response Team',
    description: 'Professional responder. Requires verification. High-level incident management and tactical coordination.',
    icon: 'shield',
    iconBgClass: 'bg-primary-fixed',
    iconTextClass: 'text-primary',
  },
];

const SelectRole = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  // Floating particle effect for the background
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.body.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, #faf8ff 0%, #f3f3fd 100%)`;
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.background = ''; // reset on unmount
    };
  }, []);

  const handleConfirm = () => {
    if (!selectedRole) return;
    // TODO: Connect to real API to set user role
    // Example: dispatch(updateUserRole(selectedRole))
    navigate('/home');
  };

  return (
    <div className="bg-background text-on-surface text-base min-h-screen flex flex-col">
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-4 h-14 shadow-sm">
        <div className="text-xl font-bold text-primary">Protocol Zero</div>
        <div className="flex gap-4">
          <button className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-24 pb-32 max-w-2xl mx-auto w-full">
        {/* Progress Indicator */}
        <div className="w-full h-1 bg-surface-container rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-primary w-1/3 transition-all duration-500"></div>
        </div>

        <section className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-on-surface">Identify Your Role</h1>
          <p className="text-base text-on-surface-variant">
            Choose how you wish to contribute to the Protocol Zero network. Your role determines your access and responsibilities during active incidents.
          </p>
        </section>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const isActive = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`flex flex-col items-start p-4 border-2 rounded-xl text-left transition-all duration-200 group relative ${
                  isActive 
                    ? 'border-primary bg-surface-container-low shadow-[0_4px_12px_rgba(0,61,155,0.1)] scale-[0.98]' 
                    : 'border-outline-variant bg-white hover:border-primary-fixed-dim hover:shadow-md'
                }`}
              >
                <div 
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
                    isActive ? 'bg-primary text-white scale-110' : `${role.iconBgClass} ${role.iconTextClass} group-hover:scale-110`
                  }`}
                >
                  <span className="material-symbols-outlined">{role.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-1">{role.title}</h3>
                <p className="text-sm text-on-surface-variant">{role.description}</p>
                <div 
                  className={`absolute top-4 right-4 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                >
                  <span className="material-symbols-outlined text-primary font-bold">check_circle</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Action (Sticky on Mobile) */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-surface/90 backdrop-blur-lg flex flex-col gap-2 md:relative md:bg-transparent md:p-0 md:mt-8 z-40">
          <button
            onClick={handleConfirm}
            disabled={!selectedRole}
            className={`w-full h-14 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              selectedRole 
                ? 'bg-primary text-white cursor-pointer shadow-lg hover:brightness-110 active:scale-95' 
                : 'bg-outline-variant text-on-surface-variant cursor-not-allowed'
            }`}
          >
            Confirm Selection
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <p className="text-center text-xs font-medium text-on-surface-variant md:mt-2">
            You can change your role in settings later.
          </p>
        </div>
      </main>

      {/* Contextual Decorative Graphic (Right side on Desktop) */}
      <div className="hidden lg:block fixed right-12 top-1/2 -translate-y-1/2 w-64 h-64 opacity-10 pointer-events-none">
        {/* Decorative element placeholder */}
      </div>
    </div>
  );
};

export default SelectRole;
