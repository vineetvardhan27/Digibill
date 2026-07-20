import { Shield, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function HealthScoreCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[400px] bg-card border border-border rounded-2xl shadow-xl flex flex-col p-6 glass-strong group motion-reduce:!animate-none">
      <style>{`
        @keyframes score-count {
          0%, 15% { content: "78"; color: hsl(var(--warning)); }
          30%, 45% { content: "80"; color: hsl(var(--primary)); }
          60%, 100% { content: "82"; color: hsl(var(--success)); }
        }
        @keyframes ring-fill {
          0%, 15% { stroke-dashoffset: 69; stroke: hsl(var(--warning)); }
          30%, 45% { stroke-dashoffset: 62; stroke: hsl(var(--primary)); }
          60%, 100% { stroke-dashoffset: 56; stroke: hsl(var(--success)); }
        }
        @keyframes bar-fill-1 {
          0%, 15% { width: "60%"; }
          60%, 100% { width: "75%"; }
        }
        @keyframes bar-fill-2 {
          0%, 15% { width: "40%"; }
          60%, 100% { width: "25%"; }
        }
        @keyframes bar-fill-3 {
          0%, 15% { width: "80%"; }
          60%, 100% { width: "95%"; }
        }
        .animate-score-count::after { animation: score-count 5s infinite; content: "78"; }
        .animate-ring-fill { animation: ring-fill 5s infinite; transition: all 0.5s ease-in-out; }
        .animate-bar-1 { animation: bar-fill-1 5s infinite; transition: width 0.5s ease-in-out; }
        .animate-bar-2 { animation: bar-fill-2 5s infinite; transition: width 0.5s ease-in-out; }
        .animate-bar-3 { animation: bar-fill-3 5s infinite; transition: width 0.5s ease-in-out; }
      `}</style>
      
      <div className="flex items-center justify-between mb-8">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Health Score</span>
        <div className="flex items-center gap-1 text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">
          <ArrowUpRight className="w-3 h-3" /> Improving
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-8 relative">
        {/* SVG Circular Ring */}
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" className="stroke-muted/30" strokeWidth="8" />
          {/* Circumference = 2 * pi * 45 = ~282.7. 
              strokeDasharray = 282.7. 
              strokeDashoffset 78% = 282.7 * 0.22 = 62.
              We'll approximate with 314 (radius 50). Let's just use radius 45, circ=282.7. */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="8"
            strokeDasharray="282.7"
            strokeLinecap="round"
            className="animate-ring-fill motion-reduce:stroke-success motion-reduce:!stroke-dashoffset-[50]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold animate-score-count motion-reduce:text-success motion-reduce:after:!content-['82']"></span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-1">Excellent</span>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-success" /> On-time Payments</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-success h-full rounded-full animate-bar-1 motion-reduce:!w-[75%]" style={{ width: '60%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-destructive" /> Late Payments</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-destructive h-full rounded-full animate-bar-2 motion-reduce:!w-[25%]" style={{ width: '40%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-muted-foreground">Reliability Rating</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full rounded-full animate-bar-3 motion-reduce:!w-[95%]" style={{ width: '80%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
