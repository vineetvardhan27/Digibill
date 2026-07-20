import { BrainCircuit, CheckCircle2, Loader2, Database, ShieldCheck, TrendingUp } from 'lucide-react';

export default function AIProcessingStep() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-card border border-border rounded-[24px] shadow-xl p-8 md:p-12 glass-strong relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/50 overflow-hidden motion-reduce:!animate-none">
      
      {/* Background Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <style>{`
        @keyframes process-card-1 {
          0%, 10% { opacity: 0; transform: translateY(15px); }
          15%, 90% { opacity: 1; transform: translateY(0); }
          95%, 100% { opacity: 0; transform: translateY(-15px); }
        }
        @keyframes process-card-2 {
          0%, 30% { opacity: 0; transform: translateY(15px); }
          35%, 90% { opacity: 1; transform: translateY(0); }
          95%, 100% { opacity: 0; transform: translateY(-15px); }
        }
        @keyframes process-card-3 {
          0%, 50% { opacity: 0; transform: translateY(15px); }
          55%, 90% { opacity: 1; transform: translateY(0); }
          95%, 100% { opacity: 0; transform: translateY(-15px); }
        }
        @keyframes process-loader {
          0%, 50% { opacity: 1; display: block; }
          51%, 100% { opacity: 0; display: none; }
        }
        @keyframes process-check {
          0%, 50% { opacity: 0; transform: scale(0); }
          55%, 100% { opacity: 1; transform: scale(1); }
        }
        .animate-process-1 { animation: process-card-1 10s ease-out infinite; }
        .animate-process-2 { animation: process-card-2 10s ease-out infinite; }
        .animate-process-3 { animation: process-card-3 10s ease-out infinite; }
        .animate-loader { animation: process-loader 10s steps(1) infinite; }
        .animate-check { animation: process-check 10s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; }
      `}</style>

      <div className="flex flex-col md:flex-row-reverse items-center gap-12">
        
        {/* Text Side */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-4">
            Step 2
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4">AI Processing</h3>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
            Digibill verifies the GST, checks for duplicate invoices, and updates your cash flow and supplier health scores automatically.
          </p>
        </div>

        {/* Interactive Demo Side */}
        <div className="flex-1 w-full max-w-sm">
          <div className="relative bg-background border border-border rounded-xl shadow-lg p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-accent" /> Verification Engine
              </span>
              <div className="relative w-4 h-4">
                <Loader2 className="w-4 h-4 text-accent animate-spin absolute inset-0 animate-loader motion-reduce:hidden" />
                <CheckCircle2 className="w-4 h-4 text-success absolute inset-0 animate-check opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none" />
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              {/* Check 1 */}
              <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between animate-process-1 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Duplicate Check</p>
                    <p className="text-[10px] text-muted-foreground">No matching invoices found</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>

              {/* Check 2 */}
              <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between animate-process-2 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">GST Validation</p>
                    <p className="text-[10px] text-muted-foreground">Matched with portal</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>

              {/* Check 3 */}
              <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between animate-process-3 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Ledger Updated</p>
                    <p className="text-[10px] text-muted-foreground">Cash flow updated</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
