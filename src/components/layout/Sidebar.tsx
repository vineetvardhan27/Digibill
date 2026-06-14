import { Home, Users, FileText, BarChart3, Settings, LogOut, Store, ScanLine, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { billAPI, connectionAPI } from "@/lib/api";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "connections", label: "My Suppliers", icon: Store },
  { id: "bills", label: "Bills", icon: FileText },
  { id: "scan", label: "Scan Bill", icon: ScanLine },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "forecast", label: "Forecast", icon: TrendingUp },
  { id: "disputes", label: "Disputes", icon: AlertTriangle },
  { id: "directory", label: "Find Suppliers", icon: Users },
  { id: "connections-pending", label: "Requests", icon: Store },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [disputesCount, setDisputesCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    fetchCounts();

    // Poll every 60 seconds
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await billAPI.getDisputes({ status: 'open' });
      setDisputesCount(res.data?.length || 0);
    } catch (error) {
      console.error("Failed to fetch disputes count:", error);
    }

    try {
      const resReq = await connectionAPI.getPendingConnections();
      setRequestsCount(resReq.data?.length || 0);
    } catch (error) {
      console.error("Failed to fetch requests count:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Digibill</h1>
            <p className="text-xs text-muted-foreground">Inventory Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-5 w-5" />
                <div className="flex flex-1 items-center justify-between">
                  <span>{item.label}</span>
                  {item.id === "disputes" && disputesCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm">
                      {disputesCount}
                    </span>
                  )}
                  {item.id === "connections-pending" && requestsCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm">
                      {requestsCount}
                    </span>
                  )}
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-border/50 p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
