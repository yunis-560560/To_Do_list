import React from 'react';
import { Gamepad2 } from 'lucide-react';

const Header = () => {
  return (
    <header className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl shadow-xl border border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
          <Gamepad2 size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-white">
          FUTURE<span className="text-orange-500">MIND</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
