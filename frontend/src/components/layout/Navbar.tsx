
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Menu, X, Activity, Layers, BarChart, Home, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setIsMenuOpen(false);
  };

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

        {user && (
          <div className="hidden xl:flex items-center gap-1 bg-secondary/40 backdrop-blur-[2px] p-1.5 rounded-full border border-border/80 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 supports-[backdrop-filter]:bg-secondary/20">
              <NavLink to="/dashboard" icon={Activity}>Dashboard</NavLink>
              <NavLink to="/prediction" icon={Brain}>Prediction</NavLink>
              <NavLink to="/voice-analysis" icon={Layers}>Multimodal Analysis</NavLink>
              <NavLink to="/analytics" icon={BarChart}>Analytics</NavLink>
              <NavLink to="/settings" icon={Settings}>Settings</NavLink>
          </div>
        )}

        {/* Action Button */}
        <div className="hidden xl:flex items-center space-x-4">

          
          
          {user ? (
            <Button 
              variant="outline" 
              className="rounded-full gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary w-32"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <div className="flex gap-3 items-center">
               <Link to="/login">
                <Button variant="outline" className="rounded-full w-32 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="rounded-full w-32 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
                  Get Started
                </Button>
              </Link>
              <a href="https://www.who.int/news-room/fact-sheets/detail/parkinson-disease" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-full w-32 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
                  Learn More
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden -mr-2 hover:bg-primary/10 hover:text-primary"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="xl:hidden absolute top-20 left-0 right-0 bg-background border-b border-border shadow-xl animate-in slide-in-from-top-5">
          <div className="flex flex-col p-4 space-y-2 items-center">

            {user && (
              <>
                <NavLink to="/dashboard" icon={Activity}>Dashboard</NavLink>
                <NavLink to="/prediction" icon={Brain}>Prediction</NavLink>
                <NavLink to="/voice-analysis" icon={Layers}>Multimodal Analysis</NavLink>
                <NavLink to="/analytics" icon={BarChart}>Analytics</NavLink>
                <NavLink to="/settings" icon={Settings}>Settings</NavLink>
              </>
            )}

            <div className="pt-4 mt-2 border-t border-border flex flex-col items-center gap-3 w-full">
              {user ? (
                 <Button 
                   className="rounded-full w-48 gap-2 border-primary/20 bg-background hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300" 
                   variant="outline" 
                   onClick={handleSignOut}
                 >
                   <LogOut className="h-4 w-4" />
                   Sign Out
                 </Button>
              ) : (
                <>
                  <Link to="/login" className="block">
                     <Button variant="outline" className="rounded-full w-48 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
                       Sign In
                     </Button>
                  </Link>
                  <Link to="/register" className="block">
                    <Button variant="outline" className="rounded-full w-48 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
                      Get Started
                    </Button>
                  </Link>
                  <a href="https://www.who.int/news-room/fact-sheets/detail/parkinson-disease" target="_blank" rel="noopener noreferrer" className="block text-center">
                    <Button variant="outline" className="rounded-full w-48 border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
                      Learn More
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
