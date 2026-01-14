import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Menu, X, Activity, Layers, BarChart, Home, FileText, Settings } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon?: any }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        isActive(to)
          ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
          : 'text-foreground/70 hover:bg-background/50 hover:text-primary font-medium'
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
    </Link>
  );

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-20 transition-all duration-300 bg-background/95 backdrop-blur-md border-b border-border/10 shadow-sm supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-[98%] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-300"></div>
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              NeuroDetect
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Parkinson's Detection</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center gap-1 bg-secondary/30 p-1.5 rounded-full border border-border/50">
          <NavLink to="/" icon={Home}>Home</NavLink>
          <NavLink to="/dashboard" icon={Activity}>Dashboard</NavLink>
          <NavLink to="/prediction" icon={Brain}>Prediction</NavLink>
          <NavLink to="/voice-analysis" icon={Layers}>Multimodal Analysis</NavLink>
          <NavLink to="/analytics" icon={BarChart}>Analytics</NavLink>
          <NavLink to="/about" icon={FileText}>About</NavLink>
          <NavLink to="/settings" icon={Settings}>Settings</NavLink>
        </div>

        {/* Action Button */}
        <div className="hidden xl:flex items-center space-x-4">
            <a href="https://www.who.int/news-room/fact-sheets/detail/parkinson-disease" target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-lg rounded-full px-6">
                    Learn More
                </Button>
            </a>
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden -mr-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="xl:hidden absolute top-20 left-0 right-0 bg-background border-b border-border shadow-xl animate-in slide-in-from-top-5">
            <div className="flex flex-col p-4 space-y-2">
                <NavLink to="/" icon={Home}>Home</NavLink>
                <NavLink to="/dashboard" icon={Activity}>Dashboard</NavLink>
                <NavLink to="/prediction" icon={Brain}>Prediction</NavLink>
                <NavLink to="/voice-analysis" icon={Layers}>Multimodal Analysis</NavLink>
                <NavLink to="/analytics" icon={BarChart}>Analytics</NavLink>
                <NavLink to="/about" icon={FileText}>About</NavLink>
                <NavLink to="/settings" icon={Settings}>Settings</NavLink>
                <div className="pt-4 mt-2 border-t border-border">
                    <a href="https://www.who.int/news-room/fact-sheets/detail/parkinson-disease" target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="w-full bg-primary rounded-full">Learn More</Button>
                    </a>
                </div>
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
