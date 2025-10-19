import React, { useState, useMemo, type ReactNode } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';

type View = 'dashboard' | 'admin';

const AppLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 00-4-4H3V9a4 4 0 014-4h2a4 4 0 014 4v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm12-4V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4m14-4l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

const Sidebar: React.FC<{ view: View; setView: (view: View) => void }> = ({ view, setView }) => {
    const NavLink = ({ currentView, targetView, setView, children }: { currentView: View, targetView: View, setView: (view: View) => void, children: ReactNode }) => (
        <button
            onClick={() => setView(targetView)}
            className={`w-full flex items-center justify-start gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === targetView 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-slate-400 hover:bg-base-300 hover:text-slate-200'
            }`}
        >
            {children}
        </button>
    );

    return (
        <aside className="w-64 bg-base-200 flex flex-col p-4 border-r border-base-300">
            <div className="flex items-center gap-3 mb-10 p-2">
                <AppLogo />
                <h1 className="text-lg font-bold text-slate-100">MySlide</h1>
            </div>
            <nav className="flex flex-col gap-2">
                <NavLink currentView={view} targetView="dashboard" setView={setView}>
                    <DashboardIcon />
                    <span className="font-semibold">Dashboard</span>
                </NavLink>
                <NavLink currentView={view} targetView="admin" setView={setView}>
                    <AdminIcon />
                    <span className="font-semibold">Admin Panel</span>
                </NavLink>
            </nav>
            <div className="mt-auto text-center text-slate-500 text-xs">
                <p>&copy; 2025 MySlide</p>
            </div>
        </aside>
    );
};


const MainApp: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-base-100 flex">
      <Sidebar view={view} setView={setView} />
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        {view === 'dashboard' && <Dashboard />}
        {view === 'admin' && (
          loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : user ? (
            <AdminPanel />
          ) : (
            <Login />
          )
        )}
      </main>
    </div>
  );
};

export default App;
