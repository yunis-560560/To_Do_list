import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import HabitTracker from './components/HabitTracker';
import ProgressCharts from './components/ProgressCharts';
import WellnessChart from './components/WellnessChart';
import Leaderboard from './components/Leaderboard';
import BudgetModule from './components/BudgetModule';
import Auth from './components/Auth';
import { useHabits } from './hooks/useHabits';
import { useUser } from './hooks/useUser';

function App() {
  const { user, loading, login, signup, updateProfile, logout, requestPasswordReset, validateResetToken, confirmPasswordReset } = useUser();
  const { habits, habitLogs, hasUnsavedChanges, isSyncing, loading: habitsLoading, addHabit, updateHabit, deleteHabit, toggleHabitLog, saveAll, saveToday } = useHabits(user?.id);
  
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('futuremind_active_tab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('futuremind_active_tab', activeTab);
  }, [activeTab]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  // If not logged in, show Auth screen full screen
  if (!user) {
    return (
      <Auth 
        user={null}
        onLogin={login} 
        onSignup={signup} 
        onUpdate={updateProfile}
        onRequestPasswordReset={requestPasswordReset}
        onValidateResetToken={validateResetToken}
        onConfirmPasswordReset={confirmPasswordReset}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <ProgressCharts habits={habits} habitLogs={habitLogs} />
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
        return <BudgetModule userId={user.id} />;
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-2 sm:p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-4 sm:gap-6">
        
        {/* Header */}
        <Header />

        {/* Navigation Bar */}
        <Navbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          user={user} 
          onLogout={() => {
            logout();
            setActiveTab('dashboard'); // reset tab on logout
          }} 
        />

        {/* Tab Content */}
        {renderContent()}
        
      </div>
    </div>
  );
}

export default App;
