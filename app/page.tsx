'use client';

import Header from "./components/Header";
import Calculator from "./components/calculator/Calculator";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Calculator />
    </div>
  );
}
