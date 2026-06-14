import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  Store, 
  Users, 
  Settings, 
  LogOut, 
  Store as StoreIcon,
  Bell,
  Menu,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supplierConnectionAPI } from "@/lib/api";

const menuItems = [
  { id: "dashboard", path: "/supplier/dashboard", label: "Dashboard", icon: Home },
  { id: "directory", path: "/supplier/directory", label: "Find Shops", icon: Users },
  { id: "shops", path: "/supplier/shops", label: "My Shops", icon: Store },
  { id: "bills", path: "/supplier/bills", label: "Bills", icon: FileText },
  { id: "requests", path: "/supplier/connections/pending", label: "Requests", icon: Bell },
  { id: "profile", path: "/supplier/profile", label: "Profile", icon: Settings },
];

export function SupplierAccountLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [requestsCount, setRequestsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchRequestsCount();
    const interval = setInterval(fetchRequestsCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequestsCount = async () => {
    try {
      const res = await supplierConnectionAPI.getPendingConnections();
      setRequestsCount(res.data?.length || 0);
    } catch (error) {
      console.error("Failed to fetch pending requests", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card">
        <div className="flex items-center gap-2 text-primary font-bold">
          <StoreIcon className="w-5 h-5" /> Digibill Supplier
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex h-[calc(100vh-61px)] md:h-screen">
        {/* Sidebar */}
        <aside className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl transform transition-transform duration-200 ease-in-out md:transform-none flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          {/* Logo */}
          <div className="hidden md:flex h-16 items-center gap-3 border-b border-border/50 px-6 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <StoreIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Digibill</h1>
              <p className="text-xs text-muted-foreground">Supplier Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex flex-1 items-center justify-between">
                    <span>{item.label}</span>
                    {item.id === "requests" && requestsCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm">
                        {requestsCount}
                      </span>
                    )}
                  </div>
                </Button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-border/50 p-4 shrink-0">
            <div className="mb-4 px-2">
              <p className="text-sm font-medium line-clamp-1">{user?.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
