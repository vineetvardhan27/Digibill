import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No invitation token provided.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/supplier-auth/validate-token?token=${token}`);
        if (res.data.success) {
          setShopName(res.data.data.shopName);
          setSupplierName(res.data.data.supplierName);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post('http://localhost:5000/api/supplier-auth/accept-invite', {
        token,
        password,
        confirmPassword
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/supplier/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
        <CardHeader className="space-y-2 text-center pb-6 border-b border-border/50">
          <CardTitle className="text-2xl font-bold">Supplier Portal</CardTitle>
          <CardDescription className="text-base">
            Welcome, {supplierName || 'Supplier'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
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
              <h3 className="text-xl font-bold text-foreground">Account Activated!</h3>
              <p className="text-muted-foreground">Redirecting to login...</p>
            </div>
          ) : !error || error === 'Passwords do not match' || error.includes('8 characters') ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  Set your password to accept the invitation from <span className="font-semibold text-foreground">{shopName}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Accept Invitation
              </Button>
            </form>
          ) : (
            <div className="text-center py-6">
              <Button asChild variant="outline">
                <Link to="/supplier/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
