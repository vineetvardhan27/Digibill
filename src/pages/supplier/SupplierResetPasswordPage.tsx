import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function SupplierResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post('http://localhost:5000/api/supplier-auth/reset-password', {
        token,
        password
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/supplier/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50 text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid Request</h2>
          <p className="text-muted-foreground mb-6">No password reset token was provided.</p>
          <Button asChild>
            <Link to="/supplier/forgot-password">Request New Link</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-primary p-2 rounded-xl">
          <Store className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">
          Digibill
        </span>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold">Create New Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && !success && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Password Reset Successfully!</h3>
              <p className="text-muted-foreground">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
