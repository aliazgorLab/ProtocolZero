import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CreateReportBox = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  return (
    <div className="bg-surface-container rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden mb-4 p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary">person</span>
      </div>
      
      <Link 
        to="/reports/create"
        className="flex-1 bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-left px-5 py-3 rounded-full text-on-surface-variant text-sm border border-outline-variant/50 shadow-sm flex items-center justify-between group"
      >
        <span>Report a new incident...</span>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-alert-red text-[18px] opacity-70 group-hover:opacity-100 transition-opacity">local_fire_department</span>
          <span className="material-symbols-outlined text-tertiary text-[18px] opacity-70 group-hover:opacity-100 transition-opacity">medical_services</span>
        </div>
      </Link>
    </div>
  );
};

export default CreateReportBox;
