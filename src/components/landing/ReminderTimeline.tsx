import { Check, CheckCheck, Clock, ShieldCheck, Mail, Smartphone, RefreshCw, Bell, ArrowDownCircle } from 'lucide-react';

export default function ReminderTimeline() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[480px] bg-card border border-border rounded-2xl shadow-xl flex flex-col p-6 glass-strong group motion-reduce:!animate-none overflow-hidden">
      
      {/* Soft Ambient Backgrounds */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#25D366]/5 rounded-full blur-[50px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[50px] pointer-events-none" />

      <style>{`
        /* 12 second loop */
        @keyframes step-2 {
          0%, 8% { opacity: 0.4; color: hsl(var(--muted-foreground)); }
          9%, 95% { opacity: 1; color: hsl(var(--foreground)); }
          96%, 100% { opacity: 0.4; color: hsl(var(--muted-foreground)); }
        }
        @keyframes step-3 {
          0%, 74% { opacity: 0.4; color: hsl(var(--muted-foreground)); }
          75%, 95% { opacity: 1; color: hsl(var(--success)); }
          96%, 100% { opacity: 0.4; color: hsl(var(--muted-foreground)); }
        }
        
        @keyframes wa-bubble {
          0%, 24% { opacity: 0; transform: translateY(20px) scale(0.95); }
          27%, 95% { opacity: 1; transform: translateY(0) scale(1); }
          98%, 100% { opacity: 0; transform: translateY(-20px) scale(0.95); }
        }
        
        @keyframes wa-sent {
          0%, 25% { opacity: 0; display: none; }
          26%, 40% { opacity: 1; display: flex; }
          41%, 100% { opacity: 0; display: none; }
        }
        @keyframes wa-delivered {
          0%, 40% { opacity: 0; display: none; }
          41%, 49% { opacity: 1; display: flex; }
          50%, 100% { opacity: 0; display: none; }
        }
        @keyframes wa-seen {
          0%, 49% { opacity: 0; display: none; }
          50%, 95% { opacity: 1; display: flex; }
          96%, 100% { opacity: 0; display: none; }
        }
        
        @keyframes paid-toast {
          0%, 61% { opacity: 0; transform: translateX(20px) scale(0.95); }
          64%, 95% { opacity: 1; transform: translateX(0) scale(1); }
          98%, 100% { opacity: 0; transform: translateX(-20px) scale(0.95); }
        }
        
        @keyframes ripple-effect {
          0%, 74% { transform: scale(0.5); opacity: 0; }
          75% { opacity: 0.5; }
          90%, 100% { transform: scale(2.5); opacity: 0; }
        }

        .anim-step-2 { animation: step-2 12s steps(1) infinite; }
        .anim-step-3 { animation: step-3 12s steps(1) infinite; }
        .anim-wa-bubble { animation: wa-bubble 12s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; }
        .anim-wa-sent { animation: wa-sent 12s steps(1) infinite; }
        .anim-wa-delivered { animation: wa-delivered 12s steps(1) infinite; }
        .anim-wa-seen { animation: wa-seen 12s steps(1) infinite; }
        .anim-paid-toast { animation: paid-toast 12s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; }
        .anim-ripple { animation: ripple-effect 12s ease-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold">Reminder Engine</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-[10px] font-bold tracking-wide uppercase">
          <RefreshCw className="w-3 h-3" /> Auto Retry
        </div>
      </div>

      {/* Content Area - Timeline + Cards */}
      <div className="flex gap-4 relative z-10 flex-1">
        
        {/* Vertical Timeline Track */}
        <div className="w-4 relative flex flex-col items-center">
          <div className="absolute top-2 bottom-6 w-0.5 bg-border -z-10" />
          
          {/* Step 1 */}
          <div className="w-4 h-4 rounded-full bg-background border-2 border-primary mb-12 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          
          {/* Step 2 */}
          <div className="w-4 h-4 rounded-full bg-background border-2 border-foreground mb-[140px] anim-step-2 motion-reduce:!border-foreground">
          </div>
          
          {/* Step 3 */}
          <div className="w-4 h-4 rounded-full bg-background border-2 border-muted-foreground mt-auto relative anim-step-3 motion-reduce:!border-success motion-reduce:!text-success flex items-center justify-center">
            {/* Ripple */}
            <div className="absolute inset-0 rounded-full border-2 border-success anim-ripple motion-reduce:hidden" />
            <ShieldCheck className="w-2 h-2 text-success opacity-0 anim-step-3 motion-reduce:!opacity-100" />
          </div>
        </div>

        {/* Action Cards */}
        <div className="flex-1 space-y-4">
          
          {/* Action 1 */}
          <div className="h-4 flex items-center">
            <p className="text-xs font-bold text-foreground">Bill Created</p>
          </div>

          {/* Action 2 */}
          <div className="mt-8">
            <div className="h-4 flex items-center gap-2 anim-step-2 opacity-40 motion-reduce:!opacity-100">
              <p className="text-xs font-bold">Reminder Scheduled</p>
              <Clock className="w-3 h-3" />
            </div>

            {/* WA Bubble */}
            <div className="mt-4 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl rounded-tl-sm p-4 relative shadow-sm w-full anim-wa-bubble opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center text-white">
                  <Smartphone className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-bold text-foreground">Digibill via WhatsApp</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Hi Metro Foods, your payment of <strong className="font-bold text-[#25D366]">₹31,000</strong> is due tomorrow.
              </p>
              <div className="flex justify-between items-end mt-2">
                <span className="text-[9px] font-medium text-muted-foreground">10:42 AM</span>
                
                {/* Status Overlays */}
                <div className="relative w-16 h-4">
                  <div className="absolute right-0 top-0 flex items-center gap-1 text-[9px] font-bold text-muted-foreground anim-wa-sent opacity-0 motion-reduce:hidden">
                    Sent <Check className="w-3 h-3" />
                  </div>
                  <div className="absolute right-0 top-0 flex items-center gap-1 text-[9px] font-bold text-muted-foreground anim-wa-delivered opacity-0 motion-reduce:hidden">
                    Delivered <CheckCheck className="w-3 h-3" />
                  </div>
                  <div className="absolute right-0 top-0 flex items-center gap-1 text-[9px] font-bold text-[#34B7F1] anim-wa-seen opacity-0 motion-reduce:!opacity-100 motion-reduce:!flex">
                    Seen <CheckCheck className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Paid Toast */}
            <div className="mt-4 bg-background border border-border rounded-xl p-3 shadow-md flex items-center gap-3 anim-paid-toast opacity-0 motion-reduce:!opacity-100 motion-reduce:!transform-none">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center text-success shrink-0">
                <ArrowDownCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Metro Foods</p>
                <p className="text-xs font-bold text-success">Supplier Paid ₹31,000</p>
              </div>
            </div>

          </div>

          {/* Action 3 */}
          <div className="h-4 flex items-center gap-2 mt-auto anim-step-3 opacity-40 motion-reduce:!opacity-100 motion-reduce:!text-success">
            <p className="text-xs font-bold">Payment Synced</p>
          </div>

        </div>

      </div>
    </div>
  );
}
