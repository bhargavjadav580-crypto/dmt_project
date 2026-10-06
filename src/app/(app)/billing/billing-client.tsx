'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { recordPayment, waiveInvoice } from '@/features/billing/actions';
import { formatCurrency } from '@/lib/utils';
import { ProcessSuccessAnimation } from '@/components/shared/process-success-animation';
import {
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';

export function BillingClient({ initialInvoices }: { initialInvoices: any[] }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(initialInvoices[0] || null);

  // Payment form modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'INSURANCE'>('UPI');
  const [payAmountRupees, setPayAmountRupees] = useState<string>('');
  const [payReference, setPayReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    const balancePaise = Math.max(0, inv.totalPaise - inv.paidPaise);
    setPayAmountRupees((balancePaise / 100).toString());
    setPayReference('');
    setPayModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    setSubmitting(true);
    setError(null);

    const amountPaise = Math.round(parseFloat(payAmountRupees) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Please enter a valid payment amount.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await recordPayment(
        selectedInvoice.id,
        payMethod,
        amountPaise,
        payReference || null
      );

      if (res.ok) {
        setPayModalOpen(false);
        setShowPaymentSuccess(true);
      } else {
        setError(res.error.messageKey);
      }
    } catch (err: any) {
      setError(err?.message || 'Error recording payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaive = async () => {
    if (!selectedInvoice) return;
    const reason = prompt('Please enter the reason for waiving this invoice:');
    if (!reason) return;

    const res = await waiveInvoice(selectedInvoice.id, reason);
    if (res.ok) {
      router.refresh();
    }
  };

  const pendingList = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'WAIVED');
  const clearedList = invoices.filter((i) => i.status === 'PAID' || i.status === 'WAIVED');

  const balancePaise = selectedInvoice
    ? Math.max(0, selectedInvoice.totalPaise - selectedInvoice.paidPaise)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Billing & Cashier</h1>
          <p className="text-sm text-slate-500">
            Itemized invoicing, digital and cash payment collection, and discharge clearance
          </p>
        </div>

        <Badge variant="outline" className="px-3 py-1 font-semibold text-xs bg-white text-slate-700">
          {pendingList.length} Pending Invoices
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Invoices List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Invoices Queue ({pendingList.length})
          </h2>

          {pendingList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No pending invoices.
            </div>
          ) : (
            pendingList.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              const bal = inv.totalPaise - inv.paidPaise;

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-sm text-sky-700">
                        Token {inv.visit?.tokenNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                        {inv.visit?.patient?.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {inv.visit?.department?.name} • UHID: {inv.visit?.patient?.uhid}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(bal)}
                      </span>
                      <Badge
                        variant={inv.status === 'PARTIAL' ? 'warning' : 'info'}
                        className="text-[10px] block mt-1"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Itemized Bill */}
        <div className="lg:col-span-2 space-y-4">
          {selectedInvoice ? (
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-700 text-base">
                      Token {selectedInvoice.visit?.tokenNumber}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedInvoice.visit?.patient?.name}
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedInvoice.visit?.patient?.uhid}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Invoice #{selectedInvoice.id.slice(-8).toUpperCase()} • Department:{' '}
                    {selectedInvoice.visit?.department?.name}
                  </p>
                </div>

                <Badge
                  variant={
                    selectedInvoice.status === 'PAID'
                      ? 'success'
                      : selectedInvoice.status === 'PARTIAL'
                      ? 'warning'
                      : 'info'
                  }
                  className="text-xs font-semibold px-2.5 py-1"
                >
                  {selectedInvoice.status}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-6 pt-4">
                {/* Itemized Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-3">Category</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-600">
                            <Badge variant="outline" className="text-[10px]">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-slate-900">{item.description}</td>
                          <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                          <td className="p-3 text-right text-slate-600">
                            {formatCurrency(item.unitPricePaise)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.totalPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-72 space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatCurrency(selectedInvoice.subtotalPaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Taxes</span>
                      <span className="font-semibold">{formatCurrency(selectedInvoice.taxPaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 text-base font-bold pt-2 border-t border-slate-200">
                      <span>Total Bill</span>
                      <span className="text-sky-700">{formatCurrency(selectedInvoice.totalPaise)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Paid to Date</span>
                      <span>{formatCurrency(selectedInvoice.paidPaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-200">
                      <span>Balance Due</span>
                      <span className={balancePaise > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {formatCurrency(balancePaise)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {selectedInvoice.payments?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Recorded Payment Receipts
                    </h4>
                    <div className="space-y-1.5">
                      {selectedInvoice.payments.map((pay: any) => (
                        <div
                          key={pay.id}
                          className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border"
                        >
                          <span className="font-medium text-slate-700">
                            {pay.method} • Ref: {pay.reference || 'None'}
                          </span>
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(pay.amountPaise)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ONE Obvious Primary Action: Collect Payment / Print Receipt */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="gap-1.5 text-xs h-11"
                    >
                      <Printer className="h-4 w-4" />
                      Print Receipt Slip
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleWaive}
                      className="text-slate-500 hover:text-red-600 text-xs h-11"
                    >
                      Waive Fee
                    </Button>
                  </div>

                  {balancePaise > 0 && (
                    <Button
                      size="lg"
                      onClick={() => openPaymentModal(selectedInvoice)}
                      className="h-12 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold gap-2 shadow-xs"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>COLLECT PAYMENT ({formatCurrency(balancePaise)})</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
              Select an invoice from the queue on the left to view itemized charges.
            </div>
          )}
        </div>
      </div>

      {/* Collect Payment Modal Dialog */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Payment • Token {selectedInvoice?.visit?.tokenNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 rounded-lg border text-xs flex justify-between">
              <span className="text-slate-500">Total Outstanding Balance:</span>
              <strong className="text-slate-900 font-bold">{formatCurrency(balancePaise)}</strong>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                  { id: 'INSURANCE', label: 'Insurance', icon: ShieldCheck },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = payMethod === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as any)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs font-semibold ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount to Collect (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={payAmountRupees}
                onChange={(e) => setPayAmountRupees(e.target.value)}
                className="h-12 text-lg font-bold text-sky-700"
                step="0.01"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference">Transaction Reference / Receipt # (optional)</Label>
              <Input
                id="reference"
                placeholder="e.g. UPI Ref / Card Last 4 digits / Policy #"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                className="h-11 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={submitting}
              className="h-11 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              {submitting ? 'Recording...' : 'Confirm Payment & Clearance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Success Animation */}
      <ProcessSuccessAnimation
        isOpen={showPaymentSuccess}
        onClose={() => {
          setShowPaymentSuccess(false);
          router.refresh();
        }}
        badgeText="Payment Cleared"
        title="Payment Collected Successfully"
        subtitle={`Recorded ₹${payAmountRupees} via ${payMethod}. Patient now holds financial clearance for discharge.`}
        tokenNumber={selectedInvoice?.visit?.tokenNumber}
        patientName={selectedInvoice?.visit?.patient?.name}
        departmentName="Billing Clearance Done"
        showPrint={true}
        primaryActionLabel="Proceed to Discharge"
        primaryActionHref="/discharge"
        secondaryActionLabel="Close Receipt"
        onSecondaryAction={() => {
          setShowPaymentSuccess(false);
          router.refresh();
        }}
      />
    </div>
  );
}
