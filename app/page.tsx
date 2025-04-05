import Link from 'next/link';
import Header from './components/Header'; // Keep header for now

export default function StartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-4">Welcome to Wall U-Value Calculator</h1>
        <p className="text-lg mb-8 text-center max-w-prose">
          Calculate the thermal transmittance (U-value) of your wall constructions, visualize temperature gradients, and check for potential condensation issues.
        </p>
        <Link href="/calculator" legacyBehavior>
          <a className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-semibold">
            Go to Calculator
          </a>
        </Link>
        {/* Optional: Add link to house sample page if desired */}
        {/* <Link href="/houseSamplePage" legacyBehavior>
          <a className="mt-4 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-lg font-semibold">
            View House Sample
          </a>
        </Link> */}
      </main>
    </div>
  );
}
