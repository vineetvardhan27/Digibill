import { Store, User, ArrowRight, CheckCircle2, Eye, Zap } from 'lucide-react';

export default function SupplierFlowDemo() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[400px] bg-card border border-border rounded-2xl shadow-xl flex items-center justify-center p-6 glass-strong group motion-reduce:!animate-none">
      <style>{`
        @keyframes travel-dot-flow {
          0%, 10% { left: 10%; opacity: 0; }
          15% { opacity: 1; }
          60% { left: 90%; opacity: 1; transform: translateX(-100%); }
          70%, 100% { left: 90%; opacity: 0; transform: translateX(-100%); }
        }
        @keyframes badge-step-1 {
          0%, 10% { opacity: 0; transform: translateY(10px); }
          15%, 35% { opacity: 1; transform: translateY(0); }
          40%, 100% { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes badge-step-2 {
          0%, 35% { opacity: 0; transform: translateY(10px); }
          40%, 60% { opacity: 1; transform: translateY(0); }
          65%, 100% { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes badge-step-3 {
          0%, 60% { opacity: 0; transform: translateY(10px); }
          65%, 85% { opacity: 1; transform: translateY(0); }
          90%, 100% { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes badge-step-4 {
          0%, 85% { opacity: 0; transform: translateY(10px); }
          90%, 100% { opacity: 1; transform: translateY(0); }
        }
        .animate-travel-dot-flow { animation: travel-dot-flow 6s ease-in-out infinite; }
        .animate-badge-step-1 { animation: badge-step-1 6s ease-in-out infinite; }
        .animate-badge-step-2 { animation: badge-step-2 6s ease-in-out infinite; }
        .animate-badge-step-3 { animation: badge-step-3 6s ease-in-out infinite; }
        .animate-badge-step-4 { animation: badge-step-4 6s ease-in-out infinite; }
      `}</style>
      
      <div className="w-full relative flex items-center justify-between">
        
        {/* Connection Line */}
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border z-0" />
        
        {/* Traveling Dot */}
        <div className="absolute top-1/2 -translate-y-1/2 z-10 motion-safe:animate-travel-dot-flow motion-reduce:hidden">
          <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
        </div>
        
        {/* Status Badges Container (Floating above line) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-16 z-20 flex flex-col items-center justify-center w-full">
          <div className="absolute animate-badge-step-1 opacity-0 motion-reduce:hidden bg-background border border-border px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-muted-foreground" /> Invoice Sent
          </div>
          <div className="absolute animate-badge-step-2 opacity-0 motion-reduce:hidden bg-background border border-border px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-accent" /> Invoice Viewed
          </div>
          <div className="absolute animate-badge-step-3 opacity-0 motion-reduce:hidden bg-background border border-border px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-success" /> Invoice Accepted
          </div>
          <div className="absolute animate-badge-step-4 opacity-0 motion-reduce:!opacity-100 bg-success/10 text-success border border-success/20 px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Payment Completed
          </div>
        </div>

        {/* Shop Card */}
        <div className="w-24 h-28 bg-background border border-border rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 z-10 relative">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Store className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold">Your Shop</span>
        </div>

        {/* Supplier Card */}
        <div className="w-24 h-28 bg-background border border-border rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 z-10 relative">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
            <User className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold">Supplier</span>
        </div>

      </div>
    </div>
  );
}
