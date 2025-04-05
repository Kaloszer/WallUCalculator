import Link from "next/link"; // Add Link import
import { MoveRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="py-6 px-8 flex items-center justify-between border-b">
      <div>
        <h1 className="text-2xl font-bold">Wall U-Value Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Calculate thermal performance of wall assemblies
        </p>
      </div>
      <nav className="flex gap-4 items-center"> {/* Add nav container */}
        <Link href="/" legacyBehavior><a className="text-sm font-medium hover:underline underline-offset-4">Home</a></Link>
        <Link href="/calculator" legacyBehavior><a className="text-sm font-medium hover:underline underline-offset-4">Calculator</a></Link>
      </nav>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        asChild
      >
        <a
          href="https://github.com/Kaloszer"
          target="_blank"
          rel="noopener noreferrer"
        >
          My Github
          <MoveRight className="h-4 w-4" />
        </a>
      </Button>
    </header>
  );
}
