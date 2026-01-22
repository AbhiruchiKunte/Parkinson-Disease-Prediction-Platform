
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Linkedin, Mail, Eye, EyeOff, User, ArrowLeft, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;
      
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      
      {/* Background Image Overlay matching Hero Section */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>

      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
        <Link to="/">
          <Button variant="ghost" className="rounded-full text-white hover:bg-white/20 hover:text-white transition-all duration-300 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-5 bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl z-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-300"></div>
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-xl group-hover:scale-105 transition-transform duration-300">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Create an account</h2>
          <p className="mt-1 text-sm text-muted-foreground font-medium">Join us to start your journey</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground/80">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-10 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-muted-foreground font-medium backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 rounded-full">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => handleSocialLogin('google')} className="w-full h-9 rounded-full border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.52-1.133 8.573-3.293 2.093-2.16 2.707-5.413 2.707-8.227 0-.76-.08-1.48-.213-2.173h-11.067z"
              />
            </svg>
            Google
          </Button>
          <Button variant="outline" onClick={() => handleSocialLogin('linkedin')} className="w-full h-9 rounded-full border-primary/20 text-primary bg-background hover:bg-primary hover:text-white hover:border-primary shadow-sm hover:shadow-md transition-all duration-300">
             <Linkedin className="mr-2 h-4 w-4" />
            LinkedIn
          </Button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-blue-600 hover:underline transition-all">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
