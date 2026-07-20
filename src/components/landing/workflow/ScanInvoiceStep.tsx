import { Camera, CheckCircle2, Sparkles } from 'lucide-react';

export default function ScanInvoiceStep() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-card border border-border rounded-[24px] shadow-xl p-8 md:p-12 glass-strong relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/50 overflow-hidden motion-reduce:!animate-none">
      
      {/* Background Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <style>{`
        @keyframes ocr-sweep {
          0%, 10% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          40% { top: 100%; opacity: 1; }
          45%, 100% { top: 100%; opacity: 0; }
        }
        @keyframes field-pop {
          0%, 30% { opacity: 0; transform: translateY(10px); }
          35%, 90% { opacity: 1; transform: translateY(0); }
          95%, 100% { opacity: 0; transform: translateY(-5px); }
        }
        @keyframes field-pop-delay {
          0%, 35% { opacity: 0; transform: translateY(10px); }
          40%, 90% { opacity: 1; transform: translateY(0); }
          95%, 100% { opacity: 0; transform: translateY(-5px); }
        }
        @keyframes badge-verified {
          0%, 45% { opacity: 0; transform: scale(0.9); }
          50%, 90% { opacity: 1; transform: scale(1); }
          95%, 100% { opacity: 0; transform: scale(0.9); }
        }
        .animate-ocr-sweep { animation: ocr-sweep 10s ease-in-out infinite; }
        .animate-field-pop { animation: field-pop 10s ease-out infinite; }
        .animate-field-pop-delay { animation: field-pop-delay 10s ease-out infinite; }
        .animate-badge-verified { animation: badge-verified 10s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; }
      `}</style>

      <div className="flex flex-col md:flex-row items-center gap-12">
        
        {/* Text Side */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            Step 1
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4">Scan Invoice</h3>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
            Upload any physical or digital bill. Digibill's Vision AI instantly reads the details. No manual data entry required.
          </p>
        </div>

        {/* Interactive Demo Side */}
        <div className="flex-1 w-full max-w-sm">
          <div className="relative bg-background border border-border rounded-xl shadow-lg p-6 overflow-hidden">
            {/* OCR Scanner Line */}
            <div className="absolute left-0 right-0 h-1 bg-primary z-40 pointer-events-none animate-ocr-sweep shadow-[0_0_15px_rgba(var(--primary),1)] motion-reduce:hidden" />
            
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Camera className="w-4 h-4" /> AI Scanner
              </span>
              <span className="animate-badge-verified opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Verified
              </span>
            </div>

            <div className="space-y-5 relative z-10">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Supplier Name</div>
                <div className="relative h-7">
                  <div className="absolute inset-0 bg-muted/50 rounded motion-safe:animate-pulse" />
                  <div className="absolute inset-0 bg-card rounded border border-border flex items-center px-3 animate-field-pop opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                    <span className="text-sm font-semibold">Sharma Supplies</span>
                    <CheckCircle2 className="w-3 h-3 text-success ml-auto" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Invoice No</div>
                  <div className="relative h-7">
                    <div className="absolute inset-0 bg-muted/50 rounded motion-safe:animate-pulse" />
                    <div className="absolute inset-0 bg-card rounded border border-border flex items-center px-3 animate-field-pop-delay opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                      <span className="text-xs font-mono">INV-8492</span>
                      <CheckCircle2 className="w-3 h-3 text-success ml-auto" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Date</div>
                  <div className="relative h-7">
                    <div className="absolute inset-0 bg-muted/50 rounded motion-safe:animate-pulse" />
                    <div className="absolute inset-0 bg-card rounded border border-border flex items-center px-3 animate-field-pop-delay opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                      <span className="text-xs font-semibold">12 Aug 2026</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Amount</div>
                <div className="relative h-9">
                  <div className="absolute inset-0 bg-muted/50 rounded motion-safe:animate-pulse" />
                  <div className="absolute inset-0 bg-card rounded border border-border flex items-center px-3 animate-badge-verified opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                    <span className="text-lg font-extrabold text-foreground tracking-tight">₹14,500</span>
                    <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
