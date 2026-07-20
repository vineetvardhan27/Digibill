import ScanInvoiceStep from './ScanInvoiceStep';
import AIProcessingStep from './AIProcessingStep';
import SupplierPortalStep from './SupplierPortalStep';
import PaymentCompleteStep from './PaymentCompleteStep';

export default function HowItWorksWorkflow() {
  return (
    <div className="relative w-full max-w-5xl mx-auto py-12 md:py-24">
      <style>{`
        @keyframes packet-travel {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-packet {
          animation: packet-travel 10s linear infinite;
        }
      `}</style>

      {/* Central Connecting Line (Desktop Only) */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-12 bottom-12 w-[2px] border-l-2 border-dashed border-border z-0" />
      
      {/* Traveling Glowing Packet (Desktop Only) */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-12 bottom-12 w-[2px] z-10 motion-reduce:hidden">
        <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),1)] animate-packet" />
      </div>

      <div className="space-y-12 md:space-y-32 relative z-20">
        
        <div className="reveal opacity-0" style={{ transitionDelay: '150ms' }}>
          <ScanInvoiceStep />
        </div>

        <div className="reveal opacity-0" style={{ transitionDelay: '300ms' }}>
          <AIProcessingStep />
        </div>

        <div className="reveal opacity-0" style={{ transitionDelay: '450ms' }}>
          <SupplierPortalStep />
        </div>

        <div className="reveal opacity-0" style={{ transitionDelay: '600ms' }}>
          <PaymentCompleteStep />
        </div>

      </div>
    </div>
  );
}
