'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  collectSample,
  startProcessing,
  enterResult,
} from '@/features/lab/actions';
import { ProcessSuccessAnimation } from '@/components/shared/process-success-animation';
import {
  FlaskConical,
  TestTube,
  CheckCircle2,
  Clock,
  Play,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export function LaboratoryClient({ initialOrders }: { initialOrders: any[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group by stages
  const waitingForSample = orders.filter((o) => o.status === 'ORDERED');
  const inProcessing = orders.filter((o) => o.status === 'SAMPLE_COLLECTED' || o.status === 'PROCESSING');
  const reportsReady = orders.filter((o) => o.status === 'RESULT_ENTERED' || o.status === 'REVIEWED');

  const handleCollect = async (orderId: string) => {
    setError(null);
    const res = await collectSample(orderId);
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.error.messageKey);
    }
  };

  const handleStartProcessing = async (orderId: string) => {
    setError(null);
    const res = await startProcessing(orderId);
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.error.messageKey);
    }
  };

  const openEnterResultModal = (order: any) => {
    setSelectedOrder(order);
    const params = order.labTest?.parameters ? JSON.parse(order.labTest.parameters) : [];
    const initialVals: Record<string, string> = {};
    params.forEach((p: any) => {
      initialVals[p.name] = '';
    });
    setParameterValues(initialVals);
  };

  const handleSubmitResult = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await enterResult(selectedOrder.id, parameterValues);
      if (res.ok) {
        setCompletedOrder(selectedOrder);
        setSelectedOrder(null);
      } else {
        setError(res.error.messageKey);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laboratory Diagnostics</h1>
          <p className="text-sm text-slate-500">
            Sample collection, test processing, and electronic result reporting
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Tabs defaultValue="waiting" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="waiting" className="rounded-lg font-semibold text-xs sm:text-sm">
            Waiting for Sample ({waitingForSample.length})
          </TabsTrigger>
          <TabsTrigger value="processing" className="rounded-lg font-semibold text-xs sm:text-sm">
            Processing ({inProcessing.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-lg font-semibold text-xs sm:text-sm">
            Reports Ready ({reportsReady.length})
          </TabsTrigger>
        </TabsList>

        {/* WAITING FOR SAMPLE */}
        <TabsContent value="waiting" className="space-y-3">
          {waitingForSample.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              No orders waiting for sample collection.
            </div>
          ) : (
            waitingForSample.map((order) => (
              <Card key={order.id} className="border-slate-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-sky-700">
                        Token {order.visit?.tokenNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{order.labTest?.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {order.labTest?.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient: <strong>{order.visit?.patient?.name}</strong> • UHID:{' '}
                      {order.visit?.patient?.uhid} • Ordered by: {order.orderedBy?.name}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCollect(order.id)}
                    className="h-10 px-4 bg-sky-600 hover:bg-sky-700 text-xs font-semibold gap-1.5 shrink-0"
                  >
                    <TestTube className="h-4 w-4" />
                    Collect Sample
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* PROCESSING */}
        <TabsContent value="processing" className="space-y-3">
          {inProcessing.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              No orders currently in processing.
            </div>
          ) : (
            inProcessing.map((order) => {
              const isSampleCollected = order.status === 'SAMPLE_COLLECTED';

              return (
                <Card key={order.id} className="border-amber-200 bg-amber-50/20">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-sky-700">
                          Token {order.visit?.tokenNumber}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{order.labTest?.name}</h3>
                        <Badge variant="warning" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient: <strong>{order.visit?.patient?.name}</strong> • Sample collected at{' '}
                        {order.collectedAt ? new Date(order.collectedAt).toLocaleTimeString() : 'Recently'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSampleCollected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartProcessing(order.id)}
                          className="h-10 px-4 text-xs font-semibold gap-1.5"
                        >
                          <Play className="h-4 w-4" />
                          Start Processing
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openEnterResultModal(order)}
                          className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                        >
                          <FileText className="h-4 w-4" />
                          Enter Results
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* REPORTS READY */}
        <TabsContent value="ready" className="space-y-3">
          {reportsReady.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              No completed test reports yet today.
            </div>
          ) : (
            reportsReady.map((order) => (
              <Card key={order.id} className="border-slate-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-700">
                        Token {order.visit?.tokenNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{order.labTest?.name}</h3>
                      <Badge variant="success" className="text-xs">
                        Report Ready
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient: <strong>{order.visit?.patient?.name}</strong> • Doctor has been notified
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border max-w-sm truncate font-mono">
                    {order.result || 'Results recorded'}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Enter Result Modal Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Lab Results • {selectedOrder?.labTest?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-500">
              Enter parameter findings for patient <strong>{selectedOrder?.visit?.patient?.name}</strong> (Token: {selectedOrder?.visit?.tokenNumber}):
            </p>

            {selectedOrder?.labTest?.parameters ? (
              JSON.parse(selectedOrder.labTest.parameters).map((param: any) => {
                const val = parameterValues[param.name] || '';
                const numVal = parseFloat(val);
                const isOutOfRange =
                  !isNaN(numVal) &&
                  ((param.refLow !== undefined && numVal < param.refLow) ||
                    (param.refHigh !== undefined && numVal > param.refHigh));

                return (
                  <div key={param.name} className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <Label className="font-semibold text-slate-800">{param.name}</Label>
                      <span className="text-[11px] text-slate-400">
                        Ref: {param.refLow ?? '--'} - {param.refHigh ?? '--'} {param.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={val}
                        onChange={(e) =>
                          setParameterValues({ ...parameterValues, [param.name]: e.target.value })
                        }
                        placeholder={`Value in ${param.unit}`}
                        className={`h-9 text-xs bg-white ${
                          isOutOfRange ? 'border-red-400 text-red-600 font-bold' : ''
                        }`}
                      />
                      {isOutOfRange && (
                        <Badge variant="danger" className="text-[10px] shrink-0">
                          Out of range
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-1.5">
                <Label>Investigation Findings Summary</Label>
                <Input
                  placeholder="e.g. Normal sinus rhythm, No acute abnormality"
                  value={parameterValues['findings'] || ''}
                  onChange={(e) => setParameterValues({ findings: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResult}
              disabled={submitting}
              className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Submitting...' : 'Save & Notify Doctor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lab Result Process Completed Animation */}
      <ProcessSuccessAnimation
        isOpen={!!completedOrder}
        onClose={() => {
          setCompletedOrder(null);
          router.refresh();
        }}
        badgeText="Lab Report Finalized"
        title="Investigation Results Submitted"
        subtitle={`Electronic report for ${completedOrder?.labTest?.name || 'test'} is ready. The consulting doctor has been alerted for clinical review.`}
        tokenNumber={completedOrder?.visit?.tokenNumber}
        patientName={completedOrder?.visit?.patient?.name}
        departmentName="Laboratory Desk"
        showPrint={true}
        primaryActionLabel="Next Lab Order"
        onPrimaryAction={() => {
          setCompletedOrder(null);
          router.refresh();
        }}
        secondaryActionLabel="Close"
        onSecondaryAction={() => {
          setCompletedOrder(null);
          router.refresh();
        }}
      />
    </div>
  );
}
