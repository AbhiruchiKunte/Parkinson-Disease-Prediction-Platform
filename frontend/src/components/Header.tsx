import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Menu } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for fixed header height
      const headerOffset = 80; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b bg-card shadow-card transition-all duration-300">
      <div className="container mx-auto px-1 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Brain className="h-6 w-6 text-white cursor-pointer" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">NeuroDetect</h1>
              <p className="text-sm text-muted-foreground">Parkinson's Detection Platform</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-2">
            <a onClick={() => scrollToSection('assessment')} className="cursor-pointer text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2">
              Assessment
            </a>
            <a onClick={() => scrollToSection('upload')} className="cursor-pointer text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2">
              Batch Analysis
            </a>
            <a onClick={() => scrollToSection('results')} className="cursor-pointer text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2">
              Results
            </a>
            <a href="https://www.who.int/news-room/fact-sheets/detail/parkinson-disease" className="ml-2" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </a>
          </nav>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden transition-all duration-300 p-4">
          <nav className="flex flex-col space-y-2">
            <a onClick={() => scrollToSection('assessment')} className="cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2">
              Assessment
            </a>
            <a onClick={() => scrollToSection('upload')} className="cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2">
              Batch Analysis
            </a>
            <a onClick={() => scrollToSection('results')} className="cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2">
              Results
            </a>
            <a href="https://www.who.int/news-room/fact-sheets/detail/parkinson-disease" className="mt-2" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full">
                Learn More
              </Button>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
