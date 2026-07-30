import React, { useState, useRef, useEffect } from 'react';
import { UserCircle, Settings, LogOut, LayoutDashboard, Wallet, BarChart3, User, Menu, X, Database } from 'lucide-react';

const Navbar = ({ activeTab, onTabChange, user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'migrate', label: 'Migrate Data', icon: Database }
  ];

  return (
    <nav className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 sticky top-2 sm:top-4 z-50 flex items-center justify-between gap-2">
      {/* Mobile Hamburger Menu Button */}
      <div className="md:hidden flex items-center">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Left side: Tabs (Desktop only) */}
      <div className="hidden md:flex items-center gap-1 flex-1 min-w-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-shrink-0 items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all min-h-[48px] ${
              activeTab === tab.id 
                ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right side: Coins + Profile */}
      <div className="flex items-center gap-2 sm:gap-4 px-1 sm:px-2 flex-shrink-0">
        {/* Placeholder for Coins */}
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 bg-black hover:bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider leading-tight">Welcome back</span>
              <span className="text-sm font-bold text-zinc-200 leading-tight">{user.name}</span>
            </div>
            <UserCircle className="text-orange-500" size={24} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-zinc-700 bg-zinc-900/50">
                <p className="text-xs text-zinc-400">Level 1 Player</p>
                <p className="text-xs font-bold text-zinc-200 mt-1">{user.weight} {user.weightUnit} • {user.height} {user.heightUnit}</p>
              </div>
              <button 
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors min-h-[48px]"
                onClick={() => {
                  setIsProfileOpen(false);
                  onTabChange('profile');
                }}
              >
                <Settings size={16} /> Edit Profile
              </button>
              <button 
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition-colors min-h-[48px]"
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 md:hidden">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold transition-all min-h-[48px] ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
          <div className="h-px bg-zinc-800 my-1 mx-2"></div>
          <button
            onClick={() => {
              onLogout();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold text-red-400 hover:bg-zinc-800 transition-all min-h-[48px]"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
