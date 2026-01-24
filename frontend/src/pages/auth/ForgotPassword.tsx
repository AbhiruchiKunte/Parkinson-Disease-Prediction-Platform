import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, ArrowLeft, Mail, Lock, Eye, EyeOff, X, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Mail not found please register yourself');
      }

      setUserId(data.user_id);
      setStep('reset');
      toast.success('Email verified! Please enter your new password.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setStep('success');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden p-4">
      {/* Background Image Overlay matching Hero Section */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>

      {step === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center mx-4 transform scale-100 transition-all">
            <button 
              onClick={() => navigate('/login')}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password Updated!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your password has been changed successfully. <br/> Please login again to continue to the dashboard.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Login Now
            </Button>
          </div>
        </div>
      )}

      {/* Back to Login Button */}
      {step !== 'success' && (
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
          <Link to="/login">
            <Button variant="ghost" className="rounded-full text-white hover:bg-white/20 hover:text-white transition-all duration-300 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      )}

      <div className={`w-full max-w-md space-y-5 bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl z-10 ${step === 'success' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-300"></div>
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-xl group-hover:scale-105 transition-transform duration-300">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {step === 'verify' ? 'Reset password' : 'Create new password'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            {step === 'verify' ? 'Enter your email to verify your account' : 'Enter your new password below'}
          </p>
        </div>

        {step === 'verify' ? (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
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
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground/80">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
