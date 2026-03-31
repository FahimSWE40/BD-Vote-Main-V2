import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import bdVoteLogo from "@/assets/bd-vote-logo.png";

interface NavbarProps {
  variant?: 'landing' | 'app';
}

export function Navbar({ variant = 'landing' }: NavbarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const landingLinks = [
    { href: "/#how-it-works", label: "কিভাবে কাজ করে" },
    { href: "/#features", label: "ফিচারসমূহ" },
    { href: "/results", label: "ফলাফল" },
  ];

  const appLinks = [
    { href: "/", label: "হোম" },
    { href: "/dashboard", label: "ড্যাশবোর্ড" },
    { href: "/results", label: "ফলাফল" },
    { href: "/help", label: "সহায়তা" },
  ];

  const links = variant === 'landing' ? landingLinks : appLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <img src={bdVoteLogo} alt="BD Vote" className="h-9 w-auto" />
          <span className="text-lg sm:text-xl font-bold text-foreground">BD Vote</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {links.map((link) => {
            const isHash = link.href.includes("#");
            const isActive = isHash
              ? location.pathname === "/" && location.hash === link.href.replace("/", "")
              : location.pathname === link.href;

            if (isHash) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    const id = link.href.split("#")[1];
                    if (location.pathname !== "/") {
                      window.location.href = link.href;
                    } else {
                      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/verification">লগইন</Link>
          </Button>
          
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">মেনু খুলুন</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <img src={bdVoteLogo} alt="BD Vote" className="h-9 w-auto" />
                  <span className="text-xl font-bold">BD Vote</span>
                </div>
                
                <nav className="flex flex-col gap-2">
                  {links.map((link) => {
                    const isHash = link.href.includes("#");
                    const isActive = isHash
                      ? location.pathname === "/" && location.hash === link.href.replace("/", "")
                      : location.pathname === link.href;

                    if (isHash) {
                      return (
                        <a
                          key={link.href}
                          href={link.href}
                          onClick={(e) => {
                            e.preventDefault();
                            setIsOpen(false);
                            const id = link.href.split("#")[1];
                            if (location.pathname !== "/") {
                              window.location.href = link.href;
                            } else {
                              document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className={cn(
                            "px-4 py-3 rounded-lg text-base font-medium transition-colors",
                            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {link.label}
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "px-4 py-3 rounded-lg text-base font-medium transition-colors",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto pt-8">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/verification" onClick={() => setIsOpen(false)}>
                      লগইন
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
