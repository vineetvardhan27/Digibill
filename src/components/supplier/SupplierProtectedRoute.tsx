import { Navigate, useLocation } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { Loader2 } from 'lucide-react';

export function SupplierProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSupplierAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/supplier/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
