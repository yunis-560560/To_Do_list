import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

const defaultMessages = [
  "Loading...",
  "Preparing your dashboard...",
  "Syncing your data...",
  "Almost ready..."
];

const AppLoader = ({ isLoading = true, text = "", isFullScreen = true }) => {
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(!isLoading);
  const [messageIndex, setMessageIndex] = useState(0);

  // Handle Mount/Unmount transitions
  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      setIsFadingOut(false);
    } else {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // 300ms transition out matches plan
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Handle dynamic text cycling if no specific text is provided
  useEffect(() => {
    if (!isLoading || text) return;
    
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % defaultMessages.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isLoading, text]);

  if (!shouldRender) return null;

  const currentText = text || defaultMessages[messageIndex];

  return (
    <div 
      className={`${isFullScreen ? 'fixed inset-0 z-[9999]' : 'absolute inset-0 z-50 rounded-xl'} bg-black flex flex-col items-center justify-center transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'
      }`}
    >
      {/* Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none loader-particles">
        {/* We will generate a few particle divs via CSS */}
        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
        <div className="particle p4"></div>
        <div className="particle p5"></div>
      </div>

      <div className="relative flex flex-col items-center justify-center loader-wrapper mt-[-5vh]">
        {/* Glowing Pulse Behind Logo */}
        <div className="absolute inset-0 rounded-full loader-pulse-glow pointer-events-none"></div>

        {/* Rotating Ring */}
        <div className="absolute -inset-8 rounded-full border-[2px] border-orange-500/0 border-t-[#ff6a00] border-b-[#ff6a00] loader-spin-ring pointer-events-none"></div>

        {/* Logo Container */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center loader-logo-container bg-black z-10">
          <img 
            src={logo} 
            alt="FutureMind Loading" 
            className="w-[85%] h-[85%] object-contain drop-shadow-[0_0_15px_rgba(255,106,0,0.5)]"
          />
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-16 h-8 flex items-center justify-center relative w-full px-4 overflow-hidden">
        <p key={currentText} className="text-zinc-400 font-medium tracking-wider text-sm sm:text-base animate-fade-text text-center absolute">
          {currentText}
        </p>
      </div>
    </div>
  );
};

export default AppLoader;
