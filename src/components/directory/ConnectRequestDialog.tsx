import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { DirectorySupplier, DirectoryShop, ConnectionStatus } from '@/types';

interface ConnectRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetCategory?: string;
  initiatorType: 'shop' | 'supplier'; // 'shop' means shop is requesting a supplier, 'supplier' means supplier is requesting a shop
  onSuccess: (newStatus: ConnectionStatus) => void;
}

export function ConnectRequestDialog({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetCategory,
  initiatorType,
  onSuccess
}: ConnectRequestDialogProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const payload = initiatorType === 'shop' 
        ? { supplierAccountId: targetId, requestNote: note }
        : { shopOwnerId: targetId, requestNote: note };

      const endpoint = initiatorType === 'shop'
        ? '/api/connections/request'
        : '/api/supplier-connections/request';

      // We need to use the appropriate token depending on initiator
      // This assumes axios interceptor or similar is handling auth headers globally
      // For dual-sided apps on same browser, ensure correct token is sent
      // Here we assume standard setup (if shop, shop token; if supplier, supplier token)
      
      const token = initiatorType === 'supplier' 
        ? localStorage.getItem('supplierToken') 
        : localStorage.getItem('token');

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, 
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const isAutoAccept = response.data.data.status === 'connected';
        
        if (isAutoAccept) {
          toast({
            title: 'Connected!',
            description: `You're now connected with ${targetName}!`,
            variant: 'default'
          });
          onSuccess('connected');
        } else {
          toast({
            title: 'Request Sent',
            description: `Connection request sent to ${targetName}`,
            variant: 'default'
          });
          onSuccess('pending_sent');
        }
        
        setNote('');
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send connection request',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect with {initiatorType === 'shop' ? 'Supplier' : 'Shop'}</DialogTitle>
          <DialogDescription>
            Send a connection request to start collaborating.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <h4 className="font-medium text-lg">{targetName}</h4>
            {targetCategory && (
              <Badge variant="outline" className="mt-1">{targetCategory}</Badge>
            )}
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="note" className="text-sm font-medium">
              Add a note (optional)
            </label>
            <Textarea
              id="note"
              placeholder="Hi, we'd like to connect to manage our bills..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              className="resize-none h-24"
            />
            <div className="text-xs text-muted-foreground text-right">
              {note.length}/300
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
