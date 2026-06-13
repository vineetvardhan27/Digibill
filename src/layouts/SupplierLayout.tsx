import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Activity, 
  LogOut, 
  Menu, 
  X, 
  Store 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SupplierLayout() {
  const { supplier, logout } = useSupplierAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/supplier/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/supplier/dashboard' },
    { id: 'bills', label: 'My Bills', icon: FileText, path: '/supplier/bills' },
    { id: 'invoices', label: 'My Invoices', icon: Upload, path: '/supplier/invoices' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/supplier/activity' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold">Digibill Supplier</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-40 h-screen w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl transition-transform duration-300 ease-in-out flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 hidden md:flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Digibill</span>
        </div>

        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Supplier Portal</p>
          <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
            <p className="font-medium text-sm truncate">{supplier?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{supplier?.portalEmail}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )
                }
              >
                <Icon className={cn("h-5 w-5")} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Top Header */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between px-8 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div>
            {supplier?.shopName && (
              <p className="text-sm text-muted-foreground">
                Viewing bills from <span className="font-semibold text-foreground">{supplier.shopName}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Can add notifications or other global actions here */}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
