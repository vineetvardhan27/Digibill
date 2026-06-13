import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { SuppliersView } from "@/components/views/SuppliersView";
import { BillsView } from "@/components/views/BillsView";
import { OCRScanView } from "@/components/views/OCRScanView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { SettingsView } from "@/components/views/SettingsView";
import { ForecastView } from "@/components/views/ForecastView";
import { DisputesPage } from "@/pages/DisputesPage";

const Index = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const validTabs = ["dashboard", "suppliers", "bills", "scan", "analytics", "forecast", "settings", "disputes"];
  
  // Default to dashboard if no tab or invalid tab is provided
  const activeTab = tab && validTabs.includes(tab) ? tab : "dashboard";

  // If the user navigates to root "/", redirect them cleanly to "/dashboard" (optional but good practice)
  useEffect(() => {
    if (!tab) {
      navigate("/dashboard", { replace: true });
    } else if (!validTabs.includes(tab)) {
      // If invalid tab, show NotFound by letting App.tsx handle it, or redirect
      navigate("/dashboard", { replace: true });
    }
  }, [tab, navigate]);

  const handleTabChange = (newTab: string) => {
    navigate(`/${newTab}`);
  };

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "suppliers":
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
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="ml-64">
        <div className="min-h-screen">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default Index;
