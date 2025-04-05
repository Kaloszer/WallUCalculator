"use client";

import Header from './components/Header';
import { ExplodedWallView } from './components/ExplodedWallView';

export default function StartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <Header showTitle={false} />
      <main className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent px-4 text-center">
          Wall U-Value Calculator
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto px-4 text-center">
          Make informed decisions about your building's thermal performance with our comprehensive wall assembly analysis tools.
        </p>
        <ExplodedWallView />
      </main>
    </div>
  );
}
