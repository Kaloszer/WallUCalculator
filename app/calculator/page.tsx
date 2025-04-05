'use client';

import Header from "../components/Header";
import Calculator from "../components/calculator/Calculator";
import { WallCalculatorProvider } from "../components/calculator/context/WallCalculatorContext";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Wall Assembly Calculator</h1>
          <p className="text-slate-600 mb-6">Design and analyze your wall assembly's thermal performance</p>
          <WallCalculatorProvider>
            <Calculator />
          </WallCalculatorProvider>
        </div>
      </div>
    </div>
  );
}
