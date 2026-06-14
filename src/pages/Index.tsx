import { useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { SuppliersView } from "@/components/views/SuppliersView";
import { BillsView } from "@/components/views/BillsView";
import { OCRScanView } from "@/components/views/OCRScanView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { SettingsView } from "@/components/views/SettingsView";
import { ForecastView } from "@/components/views/ForecastView";
import { DisputesPage } from "@/pages/DisputesPage";
import SupplierDirectoryPage from "@/pages/SupplierDirectoryPage";
import PendingConnectionsPage from "@/pages/PendingConnectionsPage";
import { MobileNav } from "@/components/layout/MobileNav";

const Index = () => {
  const { tab } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const validTabs = ["dashboard", "connections", "bills", "scan", "analytics", "forecast", "settings", "disputes", "directory", "connections-pending"];
  
  // Determine active tab based on pathname or tab param
  let activeTab = "dashboard";
  if (location.pathname === "/directory") activeTab = "directory";
  else if (location.pathname === "/connections/pending") activeTab = "connections-pending";
  else if (tab && validTabs.includes(tab)) activeTab = tab;

  // If the user navigates to root "/", redirect them cleanly to "/dashboard"
  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    } else if (tab && !validTabs.includes(tab) && location.pathname !== "/directory" && location.pathname !== "/connections/pending") {
      navigate("/dashboard", { replace: true });
    }
  }, [tab, location.pathname, navigate]);

  const handleTabChange = (newTab: string) => {
    if (newTab === "connections-pending") {
      navigate("/connections/pending");
    } else {
      navigate(`/${newTab}`);
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "connections":
        return <SuppliersView />;
      case "bills":
        return <BillsView />;
      case "scan":
        return <OCRScanView />;
      case "analytics":
        return <AnalyticsView />;
      case "forecast":
        return <ForecastView />;
      case "settings":
        return <SettingsView />;
      case "disputes":
        return <DisputesPage />;
      case "directory":
        return <SupplierDirectoryPage />;
      case "connections-pending":
        return <PendingConnectionsPage />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="md:hidden">
        <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      <div className="ml-0 md:ml-64 pb-20 md:pb-0">
        <div className="min-h-screen">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default Index;
