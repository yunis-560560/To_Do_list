import React from 'react';
import logo from '../assets/logo.png'; // Make sure to save the image as logo.png in src/assets

const Header = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800 rounded-2xl shadow-lg">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center justify-center rounded-xl overflow-hidden w-10 h-10 md:w-14 md:h-14 shadow-md flex-shrink-0">
          <img src={logo} alt="FutureMind Logo" className="w-full h-full object-cover scale-125" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white truncate">
          FUTURE<span className="text-orange-500">MIND</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
