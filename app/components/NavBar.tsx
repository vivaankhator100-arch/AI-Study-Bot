'use client';

import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <Link href="/" className="text-lg font-semibold text-white">
            Study Agent
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-300">
          <Link
            href="/"
            className="rounded-full px-4 py-2 transition hover:bg-slate-700 hover:text-white"
          >
            Chat
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 transition hover:bg-slate-700 hover:text-white"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
