import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function SupplierForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      const res = await axios.post('http://localhost:5000/api/supplier-auth/forgot-password', { email });

      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-primary p-2 rounded-xl">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Digibill
          </span>
        </div>
        <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Supplier Portal
        </span>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </CardHeader>
        
        <CardContent>
          {error && !success && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Check your email</h3>
              <p className="text-sm text-muted-foreground">
                If an account exists for {email}, we have sent password reset instructions.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          <Link to="/supplier/login" className="text-sm font-semibold text-primary hover:underline">
            &larr; Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
