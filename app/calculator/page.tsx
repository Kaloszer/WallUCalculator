'use client';

import Header from "../components/Header"; // Adjusted import path
import Calculator from "../components/calculator/Calculator"; // Adjusted import path
import { WallCalculatorProvider } from "../components/calculator/context/WallCalculatorContext"; // Adjusted import path

export default function CalculatorPage() { // Renamed function for clarity
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WallCalculatorProvider>
        <Calculator />
      </WallCalculatorProvider>
    </div>
  );
}
