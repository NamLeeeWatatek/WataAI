'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CreditCard, QrCode } from 'lucide-react';

interface PaymentMethodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (provider: 'stripe' | 'payos') => void;
    loading?: boolean;
}

export function PaymentMethodDialog({
    open,
    onOpenChange,
    onSelect,
    loading
}: PaymentMethodDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Payment Method</DialogTitle>
                    <DialogDescription>
                        Choose how you would like to pay for your subscription.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button
                        variant="outline"
                        className="h-16 justify-start px-4 text-left"
                        onClick={() => onSelect('stripe')}
                        disabled={loading}
                    >
                        <CreditCard className="mr-4 h-6 w-6 text-primary" />
                        <div>
                            <div className="font-semibold">International Card</div>
                            <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-16 justify-start px-4 text-left"
                        onClick={() => onSelect('payos')}
                        disabled={loading}
                    >
                        <QrCode className="mr-4 h-6 w-6 text-green-600" />
                        <div>
                            <div className="font-semibold">Vietnam Bank Transfer</div>
                            <div className="text-xs text-muted-foreground">VietQR, MBBank, TPBank... (Powered by PayOS)</div>
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
