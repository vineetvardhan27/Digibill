import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Store, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { toast } from 'sonner';

export function SupplierRegisterPage() {
  const navigate = useNavigate();
  const { login } = useSupplierAuth();
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      const res = await axios.post('http://localhost:5000/api/supplier-auth/register', formData);

      if (res.data.success) {
        login(res.data.token, res.data.supplier);
        navigate('/supplier/dashboard');
        toast.success("Account created successfully!");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 py-12">
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
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Join the independent supplier network
          </p>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                placeholder="Ravi Traders"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your Name</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                placeholder="Ravi Kumar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+91 9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pr-10"
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

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border/50 pt-6">
          <div className="text-center w-full mb-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/supplier/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Are you a shop owner?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in here &rarr;
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
