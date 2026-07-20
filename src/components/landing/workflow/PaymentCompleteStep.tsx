import { CheckCircle2, ShieldCheck, Check } from 'lucide-react';

export default function PaymentCompleteStep() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-card border border-border rounded-[24px] shadow-xl p-8 md:p-12 glass-strong relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-success/50 overflow-hidden motion-reduce:!animate-none">
      
      {/* Background Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-success/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <style>{`
        @keyframes ring-expand {
          0% { transform: scale(0.5); opacity: 0; }
          20% { opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes ring-expand-delay {
          0%, 20% { transform: scale(0.5); opacity: 0; }
          40% { opacity: 0.3; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes draw-check {
          0%, 20% { stroke-dashoffset: 50; opacity: 0; transform: scale(0.8); }
          30%, 80% { stroke-dashoffset: 0; opacity: 1; transform: scale(1); }
          90%, 100% { opacity: 0; transform: scale(0.8); }
        }
        @keyframes fade-in-up-1 { 0%, 30% { opacity: 0; transform: translateY(10px); } 35%, 90% { opacity: 1; transform: translateY(0); } 95%, 100% { opacity: 0; transform: translateY(-10px); } }
        @keyframes fade-in-up-2 { 0%, 40% { opacity: 0; transform: translateY(10px); } 45%, 90% { opacity: 1; transform: translateY(0); } 95%, 100% { opacity: 0; transform: translateY(-10px); } }
        @keyframes fade-in-up-3 { 0%, 50% { opacity: 0; transform: translateY(10px); } 55%, 90% { opacity: 1; transform: translateY(0); } 95%, 100% { opacity: 0; transform: translateY(-10px); } }

        .animate-ring-1 { animation: ring-expand 10s ease-out infinite; }
        .animate-ring-2 { animation: ring-expand-delay 10s ease-out infinite; }
        .animate-draw-check { animation: draw-check 10s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; stroke-dasharray: 50; }
        .animate-fade-1 { animation: fade-in-up-1 10s ease-out infinite; }
        .animate-fade-2 { animation: fade-in-up-2 10s ease-out infinite; }
        .animate-fade-3 { animation: fade-in-up-3 10s ease-out infinite; }
      `}</style>

      <div className="flex flex-col md:flex-row-reverse items-center gap-12">
        
        {/* Text Side */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider mb-4">
            Step 4
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4">Payment Complete</h3>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
            Pay directly via UPI. The supplier is notified instantly, the receipt is synced to your ledger, and the loop is closed.
          </p>
        </div>

        {/* Interactive Demo Side */}
        <div className="flex-1 w-full max-w-sm">
          <div className="relative bg-background border border-border rounded-xl shadow-lg p-8 overflow-hidden flex flex-col items-center justify-center text-center">
            
            {/* Green Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success/50 via-success to-success/50" />

            {/* Expanding Rings & Checkmark */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-success/30 animate-ring-1 motion-reduce:hidden" />
              <div className="absolute inset-0 rounded-full border-2 border-success/20 animate-ring-2 motion-reduce:hidden" />
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-success animate-draw-check motion-reduce:!opacity-100 motion-reduce:!stroke-dashoffset-0 motion-reduce:!transform-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>

            <h4 className="text-xl font-extrabold mb-1 animate-fade-1 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">Payment Completed</h4>
            <p className="text-sm font-semibold text-muted-foreground mb-6 animate-fade-1 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">₹14,500 Paid via UPI</p>

            {/* Status Checklist */}
            <div className="space-y-3 w-full max-w-[200px] text-left">
              <div className="flex items-center gap-3 animate-fade-1 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-xs font-semibold">Receipt Synced</span>
              </div>
              <div className="flex items-center gap-3 animate-fade-2 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-xs font-semibold">Supplier Notified</span>
              </div>
              <div className="flex items-center gap-3 animate-fade-3 opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-xs font-semibold">Dashboard Updated</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
