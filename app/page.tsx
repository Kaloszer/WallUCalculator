import Link from 'next/link';
import { ArrowRight, Calculator, Home, LineChart } from "lucide-react";
import Header from './components/Header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 py-12 px-4">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              Wall U-Value Calculator
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Make informed decisions about your building's thermal performance with our comprehensive wall assembly analysis tools.
            </p>
            <Button size="lg" asChild className="group">
              <Link href="/calculator">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 px-4">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-500" />
                  U-Value Analysis
                </CardTitle>
                <CardDescription>
                  Calculate thermal transmittance for any wall assembly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Input your wall components and get instant U-value calculations with our intuitive interface.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-500" />
                  Temperature Gradient
                </CardTitle>
                <CardDescription>
                  Visualize temperature distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  See how temperature changes through your wall assembly and identify potential condensation risks.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  3D Visualization
                </CardTitle>
                <CardDescription>
                  Interactive wall assembly view
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Explore your wall assembly in 3D and understand how different components work together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
