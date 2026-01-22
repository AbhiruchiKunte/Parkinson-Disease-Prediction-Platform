import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast.success('Check your email for the password reset link');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden p-4">
      
      {/* Background Image Overlay matching Hero Section */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>

      {/* Back to Login Button */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
        <Link to="/login">
          <Button variant="ghost" className="rounded-full text-white hover:bg-white/20 hover:text-white transition-all duration-300 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to login
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
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Reset password</h2>
          <p className="mt-1 text-sm text-muted-foreground font-medium">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
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

          <Button type="submit" className="w-full h-10 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300" disabled={loading}>
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
