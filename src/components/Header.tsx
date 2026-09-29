import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'quiz' | 'admin';
  setActiveTab: (tab: 'quiz' | 'admin') => void;
  onResetToCatalog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onResetToCatalog,
}) => {
  return (
    <header
      id="main-header"
      className="sticky top-0 z-50 bg-[#f1f5f9]/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo + Tagline */}
        <button
          id="brand-link"
          onClick={() => {
            setActiveTab('quiz');
            onResetToCatalog();
          }}
          className="flex items-center gap-3 text-left group focus:outline-none transition-transform active:scale-95"
        >
          {/* Logo Container */}
          <div
            id="brand-logo-container"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 p-2"
          >
            <img
              src="/shock.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/shock.svg';
              }}
              alt="CTW Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Brand Name & Tagline */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none font-['Inter',sans-serif]">
                CTW
              </h1>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                INTERACTIVE
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 mt-1 leading-none">
              Correct Answer
            </span>
          </div>
        </button>

        {/* Clean Header Navigation (No technical SQL/API tabs) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="tab-interactive-quiz"
            onClick={() => {
              setActiveTab('quiz');
              onResetToCatalog();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'quiz'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-[#f1f5f9] text-slate-600 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Kuis Publik</span>
          </button>

          <button
            id="tab-admin-panel"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 shadow-xs'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Panel Admin CMS</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </div>

      </div>
    </header>
  );
};

