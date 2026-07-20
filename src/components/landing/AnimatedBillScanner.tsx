import { Camera, CheckCircle2 } from 'lucide-react';

export default function AnimatedBillScanner() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[400px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden glass-strong group motion-reduce:!animate-none">
      <style>{`
        @keyframes ocr-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { top: 100%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes camera-flash {
          0%, 10% { opacity: 0; }
          15% { opacity: 1; }
          25%, 100% { opacity: 0; }
        }
        @keyframes pop-in {
          0%, 30% { opacity: 0; transform: translateY(5px); }
          40%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop-in-delay-1 {
          0%, 45% { opacity: 0; transform: translateY(5px); }
          55%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop-in-delay-2 {
          0%, 60% { opacity: 0; transform: translateY(5px); }
          70%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop-in-delay-3 {
          0%, 75% { opacity: 0; transform: translateY(5px); }
          85%, 100% { opacity: 1; transform: translateY(0); }
        }
        .animate-ocr-scan { animation: ocr-scan 4s ease-in-out infinite; }
        .animate-camera-flash { animation: camera-flash 4s ease-out infinite; }
        .animate-pop-in { animation: pop-in 4s ease-out infinite; }
        .animate-pop-in-delay-1 { animation: pop-in-delay-1 4s ease-out infinite; }
        .animate-pop-in-delay-2 { animation: pop-in-delay-2 4s ease-out infinite; }
        .animate-pop-in-delay-3 { animation: pop-in-delay-3 4s ease-out infinite; }
      `}</style>
      
      {/* Camera Flash */}
      <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-camera-flash mix-blend-overlay motion-reduce:hidden" />

      {/* OCR Scan Line */}
      <div className="absolute left-0 right-0 h-1 bg-primary z-40 pointer-events-none animate-ocr-scan shadow-[0_0_15px_rgba(var(--primary),1)] motion-reduce:hidden" />

      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Camera className="w-4 h-4" /> Vision AI
        </span>
        <span className="text-xs font-bold text-success flex items-center gap-1 motion-safe:animate-pop-in-delay-3">
          <CheckCircle2 className="w-3 h-3" /> Scanned
        </span>
      </div>

      {/* Invoice Mockup */}
      <div className="p-6 relative z-10">
        <div className="space-y-6">
          {/* Supplier Field */}
          <div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Supplier</div>
            <div className="relative">
              <div className="w-48 h-6 bg-muted/50 rounded absolute inset-0 motion-safe:animate-pulse" />
              <div className="flex items-center justify-between motion-safe:animate-pop-in bg-background relative z-10 pr-2">
                <span className="font-semibold">Metro Foods Pvt. Ltd.</span>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>

          {/* Invoice & GST */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Invoice Number</div>
              <div className="relative">
                <div className="w-full h-6 bg-muted/50 rounded absolute inset-0 motion-safe:animate-pulse" />
                <div className="flex items-center justify-between motion-safe:animate-pop-in-delay-1 bg-background relative z-10 pr-2">
                  <span className="font-mono text-sm">INV-2026-441</span>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">GSTIN</div>
              <div className="relative">
                <div className="w-full h-6 bg-muted/50 rounded absolute inset-0 motion-safe:animate-pulse" />
                <div className="flex items-center justify-between motion-safe:animate-pop-in-delay-1 bg-background relative z-10 pr-2">
                  <span className="font-mono text-sm text-muted-foreground">07AABCD1234E1Z</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Amount</div>
              <div className="relative">
                <div className="w-full h-8 bg-muted/50 rounded absolute inset-0 motion-safe:animate-pulse" />
                <div className="flex items-center justify-between motion-safe:animate-pop-in-delay-2 bg-background relative z-10 pr-2">
                  <span className="font-extrabold text-xl">₹31,000</span>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Due Date</div>
              <div className="relative">
                <div className="w-full h-8 bg-muted/50 rounded absolute inset-0 motion-safe:animate-pulse" />
                <div className="flex items-center justify-between motion-safe:animate-pop-in-delay-2 bg-background relative z-10 pr-2">
                  <span className="font-semibold text-warning">24 Jul 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
