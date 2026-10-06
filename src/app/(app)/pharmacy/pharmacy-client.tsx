'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PatientIdentityBar } from '@/components/patient/patient-identity-bar';
import { AllergyBanner } from '@/components/patient/allergy-banner';
import {
  dispenseMedicines,
  markSubstituteNeeded,
} from '@/features/pharmacy/actions';
import { ProcessSuccessAnimation } from '@/components/shared/process-success-animation';
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Package,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function PharmacyClient({ initialPrescriptions }: { initialPrescriptions: any[] }) {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>(initialPrescriptions);
  const [selectedRx, setSelectedRx] = useState<any | null>(initialPrescriptions[0] || null);

  // Dispense quantity map: itemId -> qty to dispense
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, number>>({});
  const [allergyChecked, setAllergyChecked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When selectedRx changes, populate quantities
  const handleSelectRx = (rx: any) => {
    setSelectedRx(rx);
    const initial: Record<string, number> = {};
    rx.items?.forEach((i: any) => {
      initial[i.id] = i.quantity - i.dispensedQty;
    });
    setDispenseQuantities(initial);
    setAllergyChecked(false);
    setError(null);
  };

  const handleDispense = async () => {
    if (!selectedRx) return;
    setError(null);

    const allergies = selectedRx.visit?.patient?.allergies
      ? JSON.parse(selectedRx.visit.patient.allergies)
      : [];

    if (allergies.length > 0 && !allergyChecked) {
      setError('You must check and acknowledge patient allergies before dispensing.');
      return;
    }

    setSubmitting(true);
    try {
      const updates = Object.keys(dispenseQuantities).map((itemId) => ({
        itemId,
        dispenseQuantity: dispenseQuantities[itemId] || 0,
      }));

      const res = await dispenseMedicines(selectedRx.id, updates);
      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        setError(res.error.messageKey);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubstitute = async (itemId: string) => {
    setError(null);
    const res = await markSubstituteNeeded(itemId);
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.error.messageKey);
    }
  };

  const pendingList = prescriptions.filter((p) => p.status !== 'DISPENSED');
  const dispensedList = prescriptions.filter((p) => p.status === 'DISPENSED');

  const selectedPatientAllergies: string[] = selectedRx?.visit?.patient?.allergies
    ? JSON.parse(selectedRx.visit.patient.allergies)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Pharmacy</h1>
          <p className="text-sm text-slate-500">
            Dispense verified medications with inventory decrement and allergy safety checks
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prescription Queue */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Prescriptions Queue ({pendingList.length})
          </h2>

          {pendingList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No pending prescriptions.
            </div>
          ) : (
            pendingList.map((rx) => {
              const isSelected = selectedRx?.id === rx.id;
              const hasAllergies = rx.visit?.patient?.allergies
                ? JSON.parse(rx.visit.patient.allergies).length > 0
                : false;

              return (
                <div
                  key={rx.id}
                  onClick={() => handleSelectRx(rx)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-sm text-emerald-800">
                        Token {rx.visit?.tokenNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                        {rx.visit?.patient?.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {rx.items?.length} medications • Dr. {rx.prescribedBy?.name}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={rx.status === 'PARTIAL' ? 'warning' : 'info'} className="text-[10px]">
                        {rx.status}
                      </Badge>
                      {hasAllergies && (
                        <Badge variant="danger" className="text-[10px]">
                          Allergies
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Dispense Interface */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRx ? (
            <>
              {/* Sticky Identity Bar */}
              <PatientIdentityBar
                patient={{
                  name: selectedRx.visit?.patient?.name,
                  ageYears: selectedRx.visit?.patient?.ageYears,
                  gender: selectedRx.visit?.patient?.gender,
                  uhid: selectedRx.visit?.patient?.uhid,
                  allergies: selectedPatientAllergies,
                }}
                tokenNumber={selectedRx.visit?.tokenNumber}
              />

              {/* Allergy Warning with Mandatory Acknowledgment */}
              {selectedPatientAllergies.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <span>Known Patient Allergies: {selectedPatientAllergies.join(', ')}</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-red-800 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={allergyChecked}
                      onChange={(e) => setAllergyChecked(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>I have verified that none of these prescribed medications cross-react with patient allergies</span>
                  </label>
                </div>
              )}

              {/* Prescription Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Prescribed Items & Inventory Status</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      Prescription #{selectedRx.id.slice(-6)}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {selectedRx.items?.map((item: any) => {
                    const stock = item.medicine?.stockQty ?? 0;
                    const isOutOfStock = stock <= 0;
                    const isLowStock = stock > 0 && stock <= 20;

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            {/* Medicine name in prominent typography */}
                            <h3 className="text-lg font-bold text-slate-900">
                              {item.medicineName}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                              Dose: {item.dose} • Frequency: {item.frequency} • Duration:{' '}
                              {item.durationDays || '--'} days
                            </p>
                          </div>

                          {/* Inventory Badge */}
                          <div className="flex items-center gap-2">
                            {isOutOfStock ? (
                              <Badge variant="danger" className="text-xs">
                                Out of Stock (0 remaining)
                              </Badge>
                            ) : isLowStock ? (
                              <Badge variant="warning" className="text-xs">
                                Low Stock ({stock} left)
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-xs">
                                Available in stock ({stock} left)
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              Requested: <strong>{item.quantity}</strong> | Dispensed so far:{' '}
                              <strong>{item.dispensedQty}</strong>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500">Dispense now:</span>
                              <Input
                                type="number"
                                min="0"
                                max={Math.min(item.quantity - item.dispensedQty, stock)}
                                value={dispenseQuantities[item.id] ?? (item.quantity - item.dispensedQty)}
                                onChange={(e) =>
                                  setDispenseQuantities({
                                    ...dispenseQuantities,
                                    [item.id]: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="h-8 w-20 text-xs bg-white text-center font-bold"
                              />
                            </div>
                          </div>

                          {isOutOfStock && item.status !== 'SUBSTITUTE_NEEDED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubstitute(item.id)}
                              className="text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs h-8"
                            >
                              Request Substitute from Doctor
                            </Button>
                          )}

                          {item.status === 'SUBSTITUTE_NEEDED' && (
                            <Badge variant="warning" className="text-xs">
                              Substitute Requested
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* ONE Obvious Primary Action Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      size="lg"
                      onClick={handleDispense}
                      disabled={submitting || selectedRx.status === 'DISPENSED'}
                      className="h-14 px-8 text-base font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>DISPENSE MEDICINES</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
              Select a prescription from the queue on the left to review and dispense.
            </div>
          )}
        </div>
      </div>

      {/* Pharmacy Dispense Completed Animation */}
      <ProcessSuccessAnimation
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.refresh();
        }}
        badgeText="Dispense Complete"
        title="Medications Dispensed"
        subtitle="Stock deducted atomically. Patient has been notified and sent to Billing Counter for invoice clearance."
        tokenNumber={selectedRx?.visit?.tokenNumber}
        patientName={selectedRx?.visit?.patient?.name}
        departmentName="Pharmacy Desk"
        showPrint={true}
        primaryActionLabel="Next Prescription"
        onPrimaryAction={() => {
          setShowSuccessModal(false);
          router.refresh();
        }}
        secondaryActionLabel="Go to Billing Desk"
        onSecondaryAction={() => {
          setShowSuccessModal(false);
          router.push('/billing');
        }}
      />
    </div>
  );
}
