import { Store, User, CheckCircle2, Clock, Mail } from 'lucide-react';

export default function SupplierPortalStep() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-card border border-border rounded-[24px] shadow-xl p-8 md:p-12 glass-strong relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/50 overflow-hidden motion-reduce:!animate-none">
      
      {/* Background Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-warning/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <style>{`
        @keyframes timeline-step-1 { 0%, 15% { opacity: 0.3; } 20%, 100% { opacity: 1; color: hsl(var(--success)); } }
        @keyframes timeline-step-2 { 0%, 35% { opacity: 0.3; } 40%, 100% { opacity: 1; color: hsl(var(--success)); } }
        @keyframes timeline-step-3 { 0%, 55% { opacity: 0.3; } 60%, 100% { opacity: 1; color: hsl(var(--success)); } }
        @keyframes timeline-step-4 { 0%, 75% { opacity: 0.3; } 80%, 100% { opacity: 1; color: hsl(var(--warning)); } }
        
        @keyframes dot-move {
          0%, 15% { left: 10%; opacity: 0; }
          20%, 35% { left: 90%; opacity: 1; }
          40%, 55% { left: 10%; opacity: 1; }
          60%, 100% { left: 90%; opacity: 0; }
        }

        .animate-timeline-1 { animation: timeline-step-1 10s steps(1) infinite; }
        .animate-timeline-2 { animation: timeline-step-2 10s steps(1) infinite; }
        .animate-timeline-3 { animation: timeline-step-3 10s steps(1) infinite; }
        .animate-timeline-4 { animation: timeline-step-4 10s steps(1) infinite; }
        .animate-dot-move { animation: dot-move 10s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col md:flex-row items-center gap-12">
        
        {/* Text Side */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-bold uppercase tracking-wider mb-4">
            Step 3
          </div>
          <h3 className="text-3xl font-extrabold tracking-tight mb-4">Supplier Portal</h3>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
            Suppliers instantly see the approved invoice in their own portal. They can raise disputes or acknowledge it, triggering automated reminders.
          </p>
        </div>

        {/* Interactive Demo Side */}
        <div className="flex-1 w-full max-w-sm">
          <div className="relative bg-background border border-border rounded-xl shadow-lg p-6 overflow-hidden">
            
            {/* Header / Entities */}
            <div className="flex justify-between items-center relative mb-8">
              {/* Connector Line */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border z-0" />
              
              {/* Moving Dot */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 animate-dot-move opacity-0 motion-reduce:hidden">
                <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
              </div>

              <div className="flex flex-col items-center gap-2 z-10 bg-background p-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Store className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold">Your Shop</span>
              </div>
              <div className="flex flex-col items-center gap-2 z-10 bg-background p-2">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold">Supplier</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="pl-4 border-l-2 border-muted relative space-y-4 ml-6">
              
              <div className="relative">
                <div className="absolute w-3 h-3 rounded-full bg-background border-2 border-muted-foreground -left-[23px] top-1 animate-timeline-1 motion-reduce:!border-success motion-reduce:!text-success" />
                <p className="text-xs font-bold text-muted-foreground animate-timeline-1 motion-reduce:!text-success">Invoice Sent</p>
                <p className="text-[10px] text-muted-foreground/70">10:42 AM</p>
              </div>

              <div className="relative">
                <div className="absolute w-3 h-3 rounded-full bg-background border-2 border-muted-foreground -left-[23px] top-1 animate-timeline-2 motion-reduce:!border-success motion-reduce:!text-success" />
                <p className="text-xs font-bold text-muted-foreground animate-timeline-2 motion-reduce:!text-success">Supplier Viewed</p>
                <p className="text-[10px] text-muted-foreground/70">11:15 AM</p>
              </div>

              <div className="relative">
                <div className="absolute w-3 h-3 rounded-full bg-background border-2 border-muted-foreground -left-[23px] top-1 animate-timeline-3 motion-reduce:!border-success motion-reduce:!text-success" />
                <p className="text-xs font-bold text-muted-foreground animate-timeline-3 motion-reduce:!text-success">Accepted</p>
                <p className="text-[10px] text-muted-foreground/70">11:20 AM</p>
              </div>

              <div className="relative">
                <div className="absolute w-3 h-3 rounded-full bg-background border-2 border-muted-foreground -left-[23px] top-1 animate-timeline-4 motion-reduce:!border-warning motion-reduce:!text-warning" />
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-muted-foreground animate-timeline-4 motion-reduce:!text-warning">Reminder Scheduled</p>
                  <Clock className="w-3 h-3 text-muted-foreground animate-timeline-4 motion-reduce:!text-warning" />
                </div>
                <p className="text-[10px] text-muted-foreground/70">Due in 3 days</p>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
