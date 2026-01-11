'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table'; // Correct casing as per previous error hints
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'open' | 'void' | 'draft' | 'uncollectible';
    provider: 'stripe' | 'payos';
    createdAt: string;
    pdfUrl?: string;
    periodStart: string;
    periodEnd: string;
}

interface BillingHistoryTableProps {
    invoices: Invoice[];
}

export function BillingHistoryTable({ invoices = [] }: BillingHistoryTableProps) {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Invoice</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {safeInvoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                No invoices found
                            </TableCell>
                        </TableRow>
                    ) : (
                        safeInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: invoice.currency.toUpperCase(),
                                    }).format(invoice.amount)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                        {invoice.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="capitalize">{invoice.provider === 'payos' ? 'Net Banking (VN)' : 'Card'}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {invoice.pdfUrl && (
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
