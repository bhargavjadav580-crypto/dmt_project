'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { assignBed, admitPatient } from '@/features/admissions/actions';
import {
  BedDouble,
  User,
  CheckCircle2,
  Sparkles,
  Wrench,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function AdmissionsClient({
  initialRequests,
  wards,
}: {
  initialRequests: any[];
  wards: any[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(initialRequests[0] || null);
  const [selectedBedToAssign, setSelectedBedToAssign] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignAndAdmit = async () => {
    if (!selectedRequest || !selectedBedToAssign) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Assign bed
      const assignRes = await assignBed(selectedRequest.id, selectedBedToAssign.id);
      if (!assignRes.ok) {
        setError(assignRes.error.messageKey);
        setSubmitting(false);
        return;
      }

      // 2. Admit patient
      const admitRes = await admitPatient(selectedRequest.id);
      if (!admitRes.ok) {
        setError(admitRes.error.messageKey);
        setSubmitting(false);
        return;
      }

      setSelectedBedToAssign(null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Error assigning bed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admissions & Bed Management</h1>
          <p className="text-sm text-slate-500">
            Real-time ward occupancy, admission requests, and bed assignment
          </p>
        </div>

        <Badge variant="outline" className="px-3 py-1 font-semibold text-xs bg-white text-slate-700">
          {requests.length} Pending Admission Requests
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Admission Requests Queue */}
      {requests.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50/20">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-indigo-900">
              Active Admission Requests ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((req) => {
              const isSelected = selectedRequest?.id === req.id;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-white shadow-xs'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-indigo-700">
                        Token {req.visit?.tokenNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {req.visit?.patient?.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        Age: {req.visit?.patient?.ageYears}y
                      </Badge>
                      <Badge variant={req.priority === 'EMERGENCY' ? 'danger' : 'info'} className="text-xs">
                        {req.priority}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      Reason: <strong>{req.reason}</strong> • Requested by: Dr. {req.requestedBy?.name}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 shrink-0">
                    {isSelected ? 'Selected (Pick a green bed below)' : 'Click to select request'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Visual Bed Board by Ward */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Ward Bed Board</h2>
          {/* Status Legend */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              Occupied
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              Cleaning
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-slate-400" />
              Maintenance
            </span>
          </div>
        </div>

        {wards.map((ward) => (
          <Card key={ward.id} className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {ward.name} ({ward.type})
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tariff: {formatCurrency(ward.dailyTariffPaise)} / day
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="font-semibold text-slate-700">
                  {ward.beds.filter((b: any) => b.status === 'AVAILABLE').length} of {ward.beds.length} Available
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ward.beds.map((bed: any) => {
                  const isAvail = bed.status === 'AVAILABLE';
                  const isOccupied = bed.status === 'OCCUPIED';
                  const isCleaning = bed.status === 'CLEANING';
                  const occupiedPatient = bed.admissions?.[0]?.visit?.patient;

                  return (
                    <div
                      key={bed.id}
                      className={`p-3 rounded-xl border text-center transition flex flex-col justify-between h-28 ${
                        isAvail
                          ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500 cursor-pointer'
                          : isOccupied
                          ? 'border-rose-300 bg-rose-50/40'
                          : isCleaning
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-200 bg-slate-100 opacity-60'
                      }`}
                      onClick={() => {
                        if (isAvail && selectedRequest) {
                          setSelectedBedToAssign(bed);
                        }
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <BedDouble
                            className={`h-4 w-4 ${
                              isAvail
                                ? 'text-emerald-600'
                                : isOccupied
                                ? 'text-rose-600'
                                : isCleaning
                                ? 'text-amber-600'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {bed.number}
                          </span>
                        </div>

                        {isOccupied && (
                          <div className="mt-2 text-left">
                            <p className="text-[11px] font-bold text-slate-900 truncate">
                              {occupiedPatient?.name || 'Occupied'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {occupiedPatient?.uhid}
                            </p>
                          </div>
                        )}

                        {isCleaning && (
                          <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-amber-700 font-medium">
                            <Sparkles className="h-3 w-3" /> Cleaning
                          </div>
                        )}

                        {bed.status === 'MAINTENANCE' && (
                          <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Wrench className="h-3 w-3" /> Maintenance
                          </div>
                        )}
                      </div>

                      {isAvail && (
                        <div className="mt-1">
                          <Badge variant="success" className="text-[10px] w-full justify-center">
                            Assign Bed
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog to Assign Bed & Admit */}
      <Dialog open={!!selectedBedToAssign} onOpenChange={(open) => !open && setSelectedBedToAssign(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Bed Assignment & Admission</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm text-slate-700">
            <p>
              Are you sure you want to assign bed <strong>{selectedBedToAssign?.number}</strong> to:
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-900">{selectedRequest?.visit?.patient?.name}</p>
              <p className="text-xs text-slate-500">
                UHID: {selectedRequest?.visit?.patient?.uhid} • Token: {selectedRequest?.visit?.tokenNumber}
              </p>
              <p className="text-xs text-slate-600 mt-1">Reason: {selectedRequest?.reason}</p>
            </div>
            <p className="text-xs text-slate-500">
              This will update the bed to OCCUPIED and transition the visit to ADMITTED status.
            </p>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setSelectedBedToAssign(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignAndAdmit}
              disabled={submitting}
              className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? 'Admitting...' : 'Confirm Assignment & Admit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
