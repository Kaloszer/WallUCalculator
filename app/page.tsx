'use client';

import Header from "./components/Header";
import Calculator from "./components/calculator/Calculator";
import { WallCalculatorProvider } from "./components/calculator/context/WallCalculatorContext";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <WallCalculatorProvider>
        <Calculator />
      </WallCalculatorProvider>
    </div>
  );
}
