import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Store,
  Bell,
  Shield,
  Download,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile", description: "Manage your account details" },
      { icon: Store, label: "Shop Details", description: "Update shop information" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", description: "Payment reminders & alerts", hasSwitch: true },
      { icon: Moon, label: "Dark Mode", description: "Toggle dark theme", hasSwitch: true },
    ],
  },
  {
    title: "Data",
    items: [
      { icon: Download, label: "Export Data", description: "Download bills & reports" },
      { icon: Shield, label: "Backup", description: "Secure your data" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", description: "FAQs & tutorials" },
    ],
  },
];

export function SettingsView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Initialize dark mode from localStorage and apply to document
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle dark mode
  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      toast.success("Dark mode enabled");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      toast.success("Light mode enabled");
    }
  };

  // Toggle notifications
  const handleNotificationsToggle = (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem("notifications", checked ? "enabled" : "disabled");
    toast.success(checked ? "Notifications enabled" : "Notifications disabled");
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Format account creation date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      year: "numeric" 
    });
  };

  // Get user initials
  const getUserInitials = (name: string | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", description: "Manage your account details" },
        { icon: Store, label: "Shop Details", description: "Update shop information" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { 
          icon: Bell, 
          label: "Notifications", 
          description: "Payment reminders & alerts", 
          hasSwitch: true,
          checked: notifications,
          onToggle: handleNotificationsToggle
        },
        { 
          icon: Moon, 
          label: "Dark Mode", 
          description: "Toggle dark theme", 
          hasSwitch: true,
          checked: darkMode,
          onToggle: handleDarkModeToggle
        },
      ],
    },
    {
      title: "Data",
      items: [
        { icon: Download, label: "Export Data", description: "Download bills & reports" },
        { icon: Shield, label: "Backup", description: "Secure your data" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "FAQs & tutorials" },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your preferences and account" />

      <main className="px-8 py-6 space-y-8 max-w-4xl">
        {/* Profile Card */}
        <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-xl">
              {getUserInitials(user?.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{user?.name || "User"}</h2>
              <p className="text-base text-muted-foreground mt-1">
                {user?.email || "No email"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {formatDate((user as any)?.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-base font-bold text-foreground uppercase tracking-wider">
              {group.title}
            </h3>
            <Card className="divide-y divide-border/50 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 shadow-md">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground text-base">
                          {item.label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {item.hasSwitch ? (
                      <Switch 
                        checked={(item as any).checked} 
                        onCheckedChange={(item as any).onToggle}
                      />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </Card>
          </div>
        ))}

        {/* Logout Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 h-12 text-base font-semibold"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>

        {/* Version */}
        <p className="text-center text-sm text-muted-foreground">
          Version 1.0.0
        </p>
      </main>
    </div>
  );
}
