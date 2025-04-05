import Link from "next/link";
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  showTitle?: boolean;
}

export default function Header({ showTitle = true }: HeaderProps) {
  return (
    <header className="py-6 px-8 flex items-center border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
      <nav className="flex gap-6 items-center mr-12">
        <Link 
          href="/" 
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Home
        </Link>
        <Link 
          href="/calculator"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Calculator
        </Link>
      </nav>
      {showTitle && (
        <div className="flex-1">
          <Link href="/" className="no-underline">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              Wall U-Value Calculator
            </h1>
            <p className="text-sm text-slate-600">
              Calculate thermal performance of wall assemblies
            </p>
          </Link>
        </div>
      )}
      <div className="ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          asChild
        >
          <a
            href="https://github.com/Kaloszer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </Button>
      </div>
    </header>
  );
}
