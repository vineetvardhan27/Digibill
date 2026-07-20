import { Download, FileText, CheckCircle2 } from 'lucide-react';

export default function GSTTableDemo() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[400px] bg-card border border-border rounded-2xl shadow-xl flex flex-col p-6 glass-strong group motion-reduce:!animate-none">
      <style>{`
        @keyframes row-fade {
          0%, 15% { opacity: 0; transform: translateX(-10px); }
          25%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes total-calc {
          0%, 65% { content: "---"; color: hsl(var(--muted-foreground)); }
          75%, 100% { content: "₹2,145"; color: hsl(var(--foreground)); }
        }
        @keyframes check-pop {
          0%, 75% { transform: scale(0); opacity: 0; }
          85%, 100% { transform: scale(1); opacity: 1; }
        }
        @keyframes button-glow {
          0%, 80% { box-shadow: 0 0 0 0 rgba(var(--primary), 0); border-color: hsl(var(--border)); }
          90%, 100% { box-shadow: 0 0 15px 0 rgba(var(--primary), 0.5); border-color: hsl(var(--primary)); }
        }
        .animate-row-1 { animation: row-fade 6s ease-out infinite; }
        .animate-row-2 { animation: row-fade 6s ease-out infinite; animation-delay: 1.5s; }
        .animate-row-3 { animation: row-fade 6s ease-out infinite; animation-delay: 3s; }
        .animate-total::after { animation: total-calc 6s steps(1) infinite; content: "---"; }
        .animate-check-pop { animation: check-pop 6s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; }
        .animate-button-glow { animation: button-glow 6s infinite; }
      `}</style>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold block">GSTR-1 Ready</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Line Item Tax</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-primary animate-button-glow motion-reduce:!border-primary motion-reduce:!shadow-[0_0_15px_rgba(var(--primary),0.5)]">
          <Download className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 bg-background rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 gap-2 bg-muted/30 p-3 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">Item</div>
          <div className="text-right">CGST</div>
          <div className="text-right">SGST</div>
          <div className="text-right">IGST</div>
        </div>
        
        {/* Rows */}
        <div className="p-2 space-y-1 text-xs">
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-2 p-2 rounded hover:bg-muted/50 animate-row-1 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none" style={{ animationFillMode: 'forwards' }}>
            <div className="col-span-1 font-medium truncate" title="Sugar 50kg">Sugar</div>
            <div className="text-right font-mono">2.5%</div>
            <div className="text-right font-mono">2.5%</div>
            <div className="text-right font-mono text-muted-foreground">-</div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-2 p-2 rounded hover:bg-muted/50 animate-row-2 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none" style={{ animationFillMode: 'forwards' }}>
            <div className="col-span-1 font-medium truncate" title="Electronics">Fan</div>
            <div className="text-right font-mono text-muted-foreground">-</div>
            <div className="text-right font-mono text-muted-foreground">-</div>
            <div className="text-right font-mono text-accent font-semibold">18%</div>
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-4 gap-2 p-2 rounded hover:bg-muted/50 animate-row-3 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none" style={{ animationFillMode: 'forwards' }}>
            <div className="col-span-1 font-medium truncate" title="Biscuits">Biscuit</div>
            <div className="text-right font-mono">9%</div>
            <div className="text-right font-mono">9%</div>
            <div className="text-right font-mono text-muted-foreground">-</div>
          </div>
        </div>
      </div>

      {/* Footer Total */}
      <div className="mt-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Tax</span>
          <CheckCircle2 className="w-4 h-4 text-success animate-check-pop motion-reduce:!opacity-100 motion-reduce:!transform-none" />
        </div>
        <span className="text-xl font-extrabold animate-total font-mono motion-reduce:after:!content-['₹2,145'] motion-reduce:text-foreground"></span>
      </div>

    </div>
  );
}
