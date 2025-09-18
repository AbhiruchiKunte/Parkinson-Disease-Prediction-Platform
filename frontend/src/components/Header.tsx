import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b bg-card shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">NeuroDetect</h1>
              <p className="text-sm text-muted-foreground">Parkinson's Detection Platform</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#assessment" className="text-foreground hover:text-primary transition-colors">
              Assessment
            </a>
            <a href="#upload" className="text-foreground hover:text-primary transition-colors">
              Batch Analysis
            </a>
            <a href="#results" className="text-foreground hover:text-primary transition-colors">
              Results
            </a>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </nav>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;