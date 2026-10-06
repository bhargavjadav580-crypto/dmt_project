'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientIdentityBar } from '@/components/patient/patient-identity-bar';
import { finalizeDischarge } from '@/features/discharge/actions';
import { ProcessSuccessAnimation } from '@/components/shared/process-success-animation';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export function DischargeClient({
  initialVisits,
  activeVisitId,
}: {
  initialVisits: any[];
  activeVisitId?: string;
}) {
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>(initialVisits);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(() => {
    if (activeVisitId) {
      return initialVisits.find((v) => v.id === activeVisitId) || initialVisits[0] || null;
    }
    return initialVisits[0] || null;
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute 5 hard-stop checks for selected visit
  const computeChecks = (v: any) => {
    if (!v) return { ready: false, checks: [] };

    // 1. Doctor clinical sign-off
    const clinicalSignOffPassed = !!v.dischargeRecord?.clinicalSignOffById;

    // 2. All lab orders reviewed
    const allLabsReviewed =
      v.labOrders.every(
        (o: any) => o.status === 'REVIEWED' || (o.status === 'RESULT_ENTERED' && o.reviewedAt !== null)
      ) || v.labOrders.length === 0;

    // 3. All prescriptions dispensed
    const allRxDispensed =
      v.prescriptions.every((rx: any) => rx.status === 'DISPENSED') || v.prescriptions.length === 0;

    // 4. Billing clearance (PAID or WAIVED)
    const invoiceCleared =
      !v.invoice || v.invoice.status === 'PAID' || v.invoice.status === 'WAIVED';

    // 5. Inpatient bed clearance
    const bedCleared = !v.admission || v.admission.status === 'DISCHARGED' || v.stage === 'READY_FOR_DISCHARGE';

    const checks = [
      {
        id: 'clinical',
        label: 'Doctor clinical sign-off',
        passed: clinicalSignOffPassed,
        link: `/consultation?visitId=${v.id}`,
        linkLabel: 'Go to Doctor Consultation',
      },
      {
        id: 'labs',
        label: 'All lab orders reviewed',
        passed: allLabsReviewed,
        link: `/lab`,
        linkLabel: 'Go to Laboratory',
      },
      {
        id: 'pharmacy',
        label: 'All medications dispensed',
        passed: allRxDispensed,
        link: `/pharmacy`,
        linkLabel: 'Go to Pharmacy',
      },
      {
        id: 'billing',
        label: 'Billing cleared (Invoice Paid or Waived)',
        passed: invoiceCleared,
        link: `/billing`,
        linkLabel: 'Go to Billing',
      },
      {
        id: 'bed',
        label: 'Inpatient bed discharge clearance',
        passed: bedCleared,
        link: `/admissions`,
        linkLabel: 'Go to Bed Board',
      },
    ];

    const ready = checks.every((c) => c.passed);
    return { ready, checks };
  };

  const { ready, checks } = computeChecks(selectedVisit);

  const handleFinalize = async () => {
    if (!selectedVisit || !ready) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await finalizeDischarge(selectedVisit.id);
      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        setError(res.error.messageKey);
      }
    } catch (err: any) {
      setError(err?.message || 'Error finalizing discharge.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discharge Management</h1>
          <p className="text-sm text-slate-500">
            Mandatory clinical and financial clearance checklist verification before patient leaves
          </p>
        </div>

        <Badge variant="outline" className="px-3 py-1 font-semibold text-xs bg-white text-slate-700">
          {visits.length} Visits in Discharge Clearance
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Candidates List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Patients for Clearance ({visits.length})
          </h2>

          {visits.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No patients currently undergoing discharge clearance.
            </div>
          ) : (
            visits.map((v) => {
              const isSelected = selectedVisit?.id === v.id;
              const isReady = v.stage === 'READY_FOR_DISCHARGE';

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVisit(v)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-700">
                        Token {v.tokenNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                        {v.patient?.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {v.department?.name} • UHID: {v.patient?.uhid}
                      </p>
                    </div>

                    <Badge variant={isReady ? 'success' : 'warning'} className="text-[10px]">
                      {v.stage}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Hard-Stop Clearance Checklist */}
        <div className="lg:col-span-2 space-y-4">
          {selectedVisit ? (
            <>
              <PatientIdentityBar
                patient={{
                  name: selectedVisit.patient?.name,
                  ageYears: selectedVisit.patient?.ageYears,
                  gender: selectedVisit.patient?.gender,
                  uhid: selectedVisit.patient?.uhid,
                  allergies: selectedVisit.patient?.allergies
                    ? JSON.parse(selectedVisit.patient.allergies)
                    : [],
                }}
                tokenNumber={selectedVisit.tokenNumber}
              />

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Discharge Readiness Checklist</span>
                    <Badge variant={ready ? 'success' : 'danger'}>
                      {ready ? 'All 5 Checks Passed' : 'Clearance Incomplete'}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* The 5 Hard-Stop Checks */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {checks.map((chk) => (
                      <div
                        key={chk.id}
                        className={`p-4 flex items-center justify-between gap-3 text-sm ${
                          chk.passed ? 'bg-white' : 'bg-red-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {chk.passed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                          )}
                          <span className={`font-medium ${chk.passed ? 'text-slate-800' : 'text-red-900 font-semibold'}`}>
                            {chk.label}
                          </span>
                        </div>

                        {!chk.passed && (
                          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1 border-red-200 text-red-700 bg-white hover:bg-red-50">
                            <Link href={chk.link}>
                              <span>{chk.linkLabel}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Summary Notes if signed off */}
                  {selectedVisit.dischargeRecord?.summary && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-500">Doctor Discharge Summary:</span>
                      <p className="font-medium text-slate-800 mt-1">
                        {selectedVisit.dischargeRecord.summary}
                      </p>
                    </div>
                  )}

                  {/* ONE Obvious Primary Action Button */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {ready
                        ? 'All clinical and billing clearance conditions are met. Ready to finalize.'
                        : 'Discharge is hard-blocked until all checklist requirements pass.'}
                    </p>

                    <Button
                      size="lg"
                      onClick={handleFinalize}
                      disabled={!ready || submitting}
                      className={`h-14 px-8 text-base font-bold shadow-md rounded-xl gap-2 w-full sm:w-auto ${
                        ready
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>COMPLETE DISCHARGE</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
              Select a patient from the queue to verify clearance.
            </div>
          )}
        </div>
      </div>

      {/* Discharge Finalized Animation */}
      <ProcessSuccessAnimation
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.refresh();
        }}
        badgeText="5/5 Clearance Passed"
        title="Patient Safely Discharged"
        subtitle="All medical reviews, medicine dispensing, and billing clearances are finalized. Patient visit is completed and inpatient beds sent to cleaning."
        tokenNumber={selectedVisit?.tokenNumber}
        patientName={selectedVisit?.patient?.name}
        departmentName="Discharge Finalized"
        showPrint={true}
        primaryActionLabel="Return to Dashboard"
        primaryActionHref="/dashboard"
        secondaryActionLabel="Next Discharge"
        onSecondaryAction={() => {
          setShowSuccessModal(false);
          router.refresh();
        }}
      />
    </div>
  );
}
