import { TrendingUp, ArrowDownRight, Wallet } from 'lucide-react';

export default function CashFlowChart() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[400px] bg-card border border-border rounded-2xl shadow-xl flex flex-col p-6 glass-strong group motion-reduce:!animate-none">
      <style>{`
        @keyframes bar-grow-1 { 0%, 10% { height: 0; } 20%, 100% { height: 40%; } }
        @keyframes bar-grow-2 { 0%, 25% { height: 0; } 35%, 100% { height: 75%; } }
        @keyframes bar-grow-3 { 0%, 40% { height: 0; } 50%, 100% { height: 95%; } }
        @keyframes float-in {
          0%, 55% { opacity: 0; transform: translateY(-10px) translateX(20px); }
          65%, 90% { opacity: 1; transform: translateY(0) translateX(20px); }
          100% { opacity: 0; transform: translateY(-10px) translateX(20px); }
        }
        @keyframes amount-count-1 { 0%, 15% { content: "₹0"; } 20%, 100% { content: "₹12k"; } }
        @keyframes amount-count-2 { 0%, 30% { content: "₹0"; } 35%, 100% { content: "₹45k"; } }
        @keyframes amount-count-3 { 0%, 45% { content: "₹0"; } 50%, 100% { content: "₹85k"; } }

        .animate-bar-grow-1 { animation: bar-grow-1 6s infinite; }
        .animate-bar-grow-2 { animation: bar-grow-2 6s infinite; }
        .animate-bar-grow-3 { animation: bar-grow-3 6s infinite; }
        .animate-float-in { animation: float-in 6s infinite; }
        .animate-amount-1::after { animation: amount-count-1 6s steps(1) infinite; content: "₹0"; }
        .animate-amount-2::after { animation: amount-count-2 6s steps(1) infinite; content: "₹0"; }
        .animate-amount-3::after { animation: amount-count-3 6s steps(1) infinite; content: "₹0"; }
      `}</style>

      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Outflow Forecast</span>
          <span className="text-2xl font-extrabold flex items-center gap-2">₹85,000 <TrendingUp className="w-5 h-5 text-destructive" /></span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between px-2 gap-4 relative">
        {/* Abstract Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between border-y border-border/50 py-4 pointer-events-none z-0">
          <div className="border-b border-dashed border-border/50 w-full" />
          <div className="border-b border-dashed border-border/50 w-full" />
          <div className="border-b border-dashed border-border/50 w-full" />
        </div>

        {/* Floating Notification */}
        <div className="absolute top-10 right-4 z-20 bg-background border border-border shadow-md rounded-lg p-3 w-40 animate-float-in motion-reduce:hidden">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground">Upcoming</p>
              <p className="text-xs font-bold">Sharma Supplies</p>
              <p className="text-xs text-destructive font-mono mt-0.5">₹14,500</p>
            </div>
          </div>
        </div>

        {/* Bars */}
        <div className="flex flex-col items-center gap-3 w-full z-10">
          <span className="text-xs font-bold animate-amount-1 motion-reduce:after:!content-['₹12k']"></span>
          <div className="w-full bg-primary/20 rounded-t-sm animate-bar-grow-1 motion-reduce:!h-[40%]" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Today</span>
        </div>
        <div className="flex flex-col items-center gap-3 w-full z-10">
          <span className="text-xs font-bold text-destructive animate-amount-2 motion-reduce:after:!content-['₹45k']"></span>
          <div className="w-full bg-destructive rounded-t-sm animate-bar-grow-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] motion-reduce:!h-[75%]" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">30 Days</span>
        </div>
        <div className="flex flex-col items-center gap-3 w-full z-10">
          <span className="text-xs font-bold text-destructive/50 animate-amount-3 motion-reduce:after:!content-['₹85k']"></span>
          <div className="w-full bg-destructive/50 rounded-t-sm animate-bar-grow-3 motion-reduce:!h-[95%]" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">90 Days</span>
        </div>
      </div>
    </div>
  );
}
