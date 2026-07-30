import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import HabitTracker from './components/HabitTracker';
import ProgressCharts from './components/ProgressCharts';
import WellnessChart from './components/WellnessChart';
import Leaderboard from './components/Leaderboard';
import BudgetModule from './components/BudgetModule';
import Auth from './components/Auth';
import AppLoader from './components/AppLoader';
import MigrationTool from './components/MigrationTool';
import { useHabits } from './hooks/useHabits';
import { useUser } from './hooks/useUser';

function App() {
  const { user, loading, login, signup, updateProfile, logout, requestPasswordReset, validateResetToken, confirmPasswordReset } = useUser();
  const { habits, habitLogs, hasUnsavedChanges, isSyncing, loading: habitsLoading, fetchError, addHabit, updateHabit, deleteHabit, toggleHabitLog, saveAll, saveToday } = useHabits(user?.id);

  // Budget unsaved-changes guard
  // BudgetModule calls this ref setter to register itself
  const budgetSaveNowRef = useRef(null);           // fn: () => Promise<void>
  const budgetHasPendingRef = useRef(false);        // bool
  const [pendingTabChange, setPendingTabChange] = useState(null); // tab string | null
  const [showBudgetGuard, setShowBudgetGuard] = useState(false);
  const [isGuardSaving, setIsGuardSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('futuremind_active_tab') || 'dashboard';
  });

  // Intercept tab changes to check for unsaved budget data
  const handleTabChange = useCallback((newTab) => {
    if (activeTab === 'budget' && budgetHasPendingRef.current && newTab !== 'budget') {
      setPendingTabChange(newTab);
      setShowBudgetGuard(true);
      return; // block the change until user decides
    }
    setActiveTab(newTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('futuremind_active_tab', activeTab);
  }, [activeTab]);

  // Handle global loading states
  const isAppLoading = loading || (habitsLoading && user);
  let loadingText = "";
  if (loading) loadingText = "Authenticating...";
  else if (habitsLoading) loadingText = "Loading your dashboard...";

  // If not logged in, show Auth screen full screen
  // (We move this logic into the main return so AppLoader can animate out smoothly)

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {fetchError && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/30 mb-6 flex items-center justify-between">
                <div>
                  <strong className="mr-2">Failed to load data:</strong> {fetchError}
                </div>
                <button onClick={() => window.location.reload()} className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-white rounded-lg text-sm transition-colors">Retry</button>
              </div>
            )}
            <ProgressCharts habits={habits} habitLogs={habitLogs} loading={habitsLoading} />
            <HabitTracker 
              habits={habits}
              habitLogs={habitLogs}
              hasUnsavedChanges={hasUnsavedChanges}
              isSyncing={isSyncing}
              loading={habitsLoading}
              onToggle={toggleHabitLog}
              onAdd={addHabit}
              onUpdate={updateHabit}
              onDelete={deleteHabit}
              onSaveAll={saveAll}
              onSaveToday={saveToday}
            />
          </>
        );
      case 'budget':
        return (
          <BudgetModule
            userId={user.id}
            onRegisterSaveNow={(fn) => { budgetSaveNowRef.current = fn; }}
            onPendingChange={(hasPending) => { budgetHasPendingRef.current = hasPending; }}
          />
        );
      case 'analysis':
        return (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 w-full overflow-hidden">
              <WellnessChart />
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <Leaderboard habits={habits} habitLogs={habitLogs} />
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="flex justify-center py-10">
             <Auth 
              user={user}
              onUpdate={updateProfile}
              onCancelEdit={() => setActiveTab('dashboard')}
            />
          </div>
        );
      case 'migrate':
        return <MigrationTool />;
      default:
        return null;
    }
  };

  return (
    <>
      <AppLoader isLoading={isAppLoading} text={loadingText} />
      
      {(!user && !loading) ? (
        <Auth 
          user={null}
          onLogin={login} 
          onSignup={signup} 
          onUpdate={updateProfile}
          onRequestPasswordReset={requestPasswordReset}
          onValidateResetToken={validateResetToken}
          onConfirmPasswordReset={confirmPasswordReset}
        />
      ) : (user && !loading) ? (
        <div className="min-h-screen bg-black text-zinc-100 font-sans p-2 sm:p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-4 sm:gap-6">
            
            {/* Header */}
            <Header />

            {/* Navigation Bar */}
            <Navbar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              user={user}
              onLogout={() => {
                if (budgetHasPendingRef.current) {
                  setPendingTabChange('__logout__');
                  setShowBudgetGuard(true);
                  return;
                }
                logout();
                setActiveTab('dashboard');
              }}
            />

            {/* Unsaved Budget Changes Dialog */}
            {showBudgetGuard && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                style={{ animation: 'fadeIn 0.15s ease' }}
              >
                <div
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                  onClick={() => !isGuardSaving && setShowBudgetGuard(false)}
                />
                <div
                  className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-7"
                  style={{ animation: 'scaleIn 0.18s ease' }}
                >
                  <h3 className="text-lg font-bold text-white text-center mb-2">Unsaved Changes</h3>
                  <p className="text-zinc-400 text-sm text-center mb-6">
                    You have unsaved budget changes.<br />
                    Do you want to save before leaving?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      disabled={isGuardSaving}
                      onClick={async () => {
                        setIsGuardSaving(true);
                        try {
                          if (budgetSaveNowRef.current) await budgetSaveNowRef.current();
                          budgetHasPendingRef.current = false;
                          setShowBudgetGuard(false);
                          if (pendingTabChange === '__logout__') {
                            logout(); setActiveTab('dashboard');
                          } else if (pendingTabChange) {
                            setActiveTab(pendingTabChange);
                          }
                        } finally { setIsGuardSaving(false); }
                      }}
                      className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-60"
                    >
                      {isGuardSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      disabled={isGuardSaving}
                      onClick={() => {
                        budgetHasPendingRef.current = false;
                        setShowBudgetGuard(false);
                        if (pendingTabChange === '__logout__') {
                          logout(); setActiveTab('dashboard');
                        } else if (pendingTabChange) {
                          setActiveTab(pendingTabChange);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold transition-colors disabled:opacity-50"
                    >
                      Discard
                    </button>
                    <button
                      disabled={isGuardSaving}
                      onClick={() => setShowBudgetGuard(false)}
                      className="w-full py-2 rounded-xl text-zinc-500 hover:text-zinc-300 font-medium transition-colors text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {renderContent()}
            
          </div>
        </div>
      ) : null}

      {/* Global dialog animations */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}


export default App;
