import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI, billAPI, supplierAPI } from "@/lib/api";

export function SettingsView() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Dialog States
  const [activeDialog, setActiveDialog] = useState<"profile" | "shop" | "help" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form States
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [shopForm, setShopForm] = useState({ shopName: "", shopAddress: "" });

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

  // Sync user data to forms when opened
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || "", phone: user.phone || "" });
      setShopForm({ shopName: user.shopName || "", shopAddress: user.shopAddress || "" });
    }
  }, [user, activeDialog]);

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

  // Update Profile
  const handleProfileSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success("Profile updated successfully");
      setActiveDialog(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Shop Details
  const handleShopSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await authAPI.updateProfile(shopForm);
      updateUser(res.data.user);
      toast.success("Shop details updated successfully");
      setActiveDialog(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update shop details");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Data / Backup
  const handleExportData = async (isBackup = false) => {
    try {
      setIsExporting(true);
      toast.loading(isBackup ? "Generating backup..." : "Exporting data...");
      
      const [billsRes, suppliersRes] = await Promise.all([
        billAPI.getBills({ limit: 10000 }),
        supplierAPI.getSuppliers({ limit: 10000 })
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: { name: user?.name, email: user?.email, shopName: user?.shopName },
        stats: {
          totalBills: billsRes.data.bills.length,
          totalSuppliers: suppliersRes.data.suppliers.length
        },
        suppliers: suppliersRes.data.suppliers,
        bills: billsRes.data.bills
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = isBackup ? `digibill-backup-${dateStr}.json` : `digibill-export-${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success(isBackup ? "Backup downloaded successfully" : "Data exported successfully");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { 
          icon: User, 
          label: "Profile", 
          description: "Manage your account details",
          onClick: () => setActiveDialog("profile")
        },
        { 
          icon: Store, 
          label: "Shop Details", 
          description: "Update shop information",
          onClick: () => setActiveDialog("shop")
        },
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
        { 
          icon: Download, 
          label: "Export Data", 
          description: "Download bills & reports",
          onClick: () => handleExportData(false)
        },
        { 
          icon: Shield, 
          label: "Backup", 
          description: "Secure your data",
          onClick: () => handleExportData(true)
        },
      ],
    },
    {
      title: "Support",
      items: [
        { 
          icon: HelpCircle, 
          label: "Help Center", 
          description: "FAQs & tutorials",
          onClick: () => setActiveDialog("help")
        },
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
            <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-xl shrink-0">
              {getUserInitials(user?.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{user?.name || "User"}</h2>
              <p className="text-base text-muted-foreground mt-1">
                {user?.email || "No email"}
              </p>
              {user?.shopName && (
                <p className="text-sm font-medium text-primary mt-1">
                  <Store className="inline h-4 w-4 mr-1" /> {user.shopName}
                </p>
              )}
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
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    disabled={isExporting && (item.label === 'Export Data' || item.label === 'Backup')}
                    className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div onClick={e => e.stopPropagation()}>
                        <Switch 
                          checked={(item as any).checked} 
                          onCheckedChange={(item as any).onToggle}
                        />
                      </div>
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

      {/* Dialogs */}
      <Dialog open={activeDialog === "profile"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={profileForm.name} 
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={profileForm.phone} 
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                placeholder="Optional"
              />
            </div>
            <Button onClick={handleProfileSubmit} disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "shop"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shop Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input 
                value={shopForm.shopName} 
                onChange={e => setShopForm({ ...shopForm, shopName: e.target.value })} 
                placeholder="e.g. Kirana Store"
              />
            </div>
            <div className="space-y-2">
              <Label>Shop Address</Label>
              <Input 
                value={shopForm.shopAddress} 
                onChange={e => setShopForm({ ...shopForm, shopAddress: e.target.value })} 
                placeholder="Optional"
              />
            </div>
            <Button onClick={handleShopSubmit} disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Shop Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "help"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Help Center & FAQs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border/50">
              <h4 className="font-bold">How do I scan a bill?</h4>
              <p className="text-sm text-muted-foreground">Go to the "Scan Bill" tab or click "Scan Bill" inside the Bills page. Upload a clear photo of your invoice, and Digibill's AI will automatically extract the supplier, amounts, dates, and line items.</p>
            </div>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border/50">
              <h4 className="font-bold">How do I track pending payments?</h4>
              <p className="text-sm text-muted-foreground">The Dashboard will show your total pending amount. In the Bills view, you can filter by "Pending" to see exactly which bills still need to be paid.</p>
            </div>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border/50">
              <h4 className="font-bold">Can I export my data?</h4>
              <p className="text-sm text-muted-foreground">Yes! Go to Settings {'>'} Data {'>'} Export Data to download a complete backup of all your suppliers and bills in JSON format.</p>
            </div>
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border/50">
              <h4 className="font-bold">Contact Support</h4>
              <p className="text-sm text-muted-foreground">If you are facing technical issues, please email support@digibill.app for assistance.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
