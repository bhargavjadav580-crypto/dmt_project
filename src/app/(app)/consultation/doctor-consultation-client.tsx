'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PatientIdentityBar } from '@/components/patient/patient-identity-bar';
import { AllergyBanner } from '@/components/patient/allergy-banner';
import { ProcessSuccessAnimation } from '@/components/shared/process-success-animation';
import {
  startConsultation,
  saveDraft,
  completeConsultation,
  addAddendum,
} from '@/features/consultation/actions';
import {
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Pill,
  BedDouble,
  FileCheck,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Send,
  Eye,
} from 'lucide-react';

interface Props {
  initialVisits: any[];
  activeVisitId?: string;
  labCatalog: any[];
  medicineCatalog: any[];
  departments: any[];
  doctorId: string;
  doctorName: string;
}

export function DoctorConsultationClient({
  initialVisits,
  activeVisitId,
  labCatalog,
  medicineCatalog,
  departments,
  doctorId,
  doctorName,
}: Props) {
  const router = useRouter();
  const [selectedVisit, setSelectedVisit] = useState<any | null>(() => {
    if (activeVisitId) {
      return initialVisits.find((v) => v.id === activeVisitId) || null;
    }
    return initialVisits[0] || null;
  });

  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icd10Code, setIcd10Code] = useState('');
  const [allergyAcknowledged, setAllergyAcknowledged] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Lab Orders
  const [selectedLabTestIds, setSelectedLabTestIds] = useState<string[]>([]);

  // Prescription Items
  const [rxItems, setRxItems] = useState<
    Array<{
      medicineId?: string;
      medicineName: string;
      dose: string;
      frequency: string;
      durationDays: number;
      quantity: number;
    }>
  >([]);

  // Next steps modal
  const [nextStepModalOpen, setNextStepModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sendToLab, setSendToLab] = useState(false);
  const [sendToPharmacy, setSendToPharmacy] = useState(false);
  const [admitPatient, setAdmitPatient] = useState(false);
  const [admissionReason, setAdmissionReason] = useState('Requires continuous monitoring & care');
  const [referPatient, setReferPatient] = useState(false);
  const [referralDeptId, setReferralDeptId] = useState(departments[0]?.id || '');
  const [referralReason, setReferralReason] = useState('');
  const [discharge, setDischarge] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load selected visit's active consultation
  useEffect(() => {
    if (!selectedVisit) return;

    if (selectedVisit.consultation) {
      setConsultationId(selectedVisit.consultation.id);
      setNotes(selectedVisit.consultation.notes || '');
      setDiagnosis(selectedVisit.consultation.diagnosis || '');
      setIcd10Code(selectedVisit.consultation.icd10Code || '');
    } else {
      // Auto start consultation
      startConsultation(selectedVisit.id).then((res) => {
        if (res.ok) {
          setConsultationId(res.data.id);
        }
      });
    }

    setAllergyAcknowledged(false);
    setSelectedLabTestIds([]);
    setRxItems([]);
  }, [selectedVisit]);

  // Autosave draft every 10s if consultationId exists
  useEffect(() => {
    if (!consultationId) return;

    const timer = setInterval(async () => {
      if (notes || diagnosis) {
        await saveDraft(consultationId, { notes, diagnosis, icd10Code });
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [consultationId, notes, diagnosis, icd10Code]);

  // Check if patient has allergies
  const allergies: string[] = selectedVisit?.patient?.allergies
    ? JSON.parse(selectedVisit.patient.allergies)
    : [];
  const hasAllergies = allergies.length > 0;

  const handleAddMedicine = (med: any) => {
    setRxItems((prev) => [
      ...prev,
      {
        medicineId: med.id,
        medicineName: `${med.name} (${med.form})`,
        dose: '1 tablet / dose',
        frequency: 'BID (Twice daily)',
        durationDays: 5,
        quantity: 10,
      },
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setRxItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOpenNextStepModal = () => {
    setError(null);
    if (hasAllergies && !allergyAcknowledged) {
      setError('You must acknowledge patient allergies before saving.');
      return;
    }

    // Auto check boxes based on builder content
    setSendToLab(selectedLabTestIds.length > 0);
    setSendToPharmacy(rxItems.length > 0);
    setDischarge(selectedLabTestIds.length === 0 && !admitPatient && !referPatient);
    setNextStepModalOpen(true);
  };

  const handleFinalizeConsultation = async () => {
    if (!consultationId) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Save latest draft first
      await saveDraft(consultationId, { notes, diagnosis, icd10Code });

      // 2. Complete consultation and execute selected next steps
      const res = await completeConsultation(consultationId, {
        sendToLab,
        labTestIds: selectedLabTestIds,
        sendToPharmacy,
        prescriptionItems: rxItems,
        admitPatient,
        admissionReason,
        referPatient,
        referralDeptId,
        referralReason,
        discharge,
      });

      if (!res.ok) {
        setError(res.error.messageKey);
        setSaving(false);
        return;
      }

      setNextStepModalOpen(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err?.message || 'Error completing consultation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Workspace</h1>
          <p className="text-sm text-slate-500">
            Consultation, diagnosis, investigation orders, and digital prescriptions
          </p>
        </div>

        {lastSaved && (
          <span className="text-xs text-slate-400 font-mono">
            Autosaved at {lastSaved}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Patient Queue Switcher Header Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {initialVisits.map((v) => {
          const isSelected = selectedVisit?.id === v.id;
          const isReview = v.needsDoctorReview;

          return (
            <button
              key={v.id}
              onClick={() => setSelectedVisit(v)}
              className={`p-3 rounded-xl border text-left shrink-0 transition flex items-center gap-3 ${
                isSelected
                  ? 'border-sky-600 bg-sky-50 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sm text-sky-700">
                    {v.tokenNumber}
                  </span>
                  {isReview && (
                    <Badge variant="warning" className="text-[10px] px-1 py-0">
                      Reports Ready
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{v.patient.name}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedVisit ? (
        <div className="space-y-6">
          {/* Sticky Identity Bar */}
          <PatientIdentityBar
            patient={{
              name: selectedVisit.patient.name,
              ageYears: selectedVisit.patient.ageYears,
              gender: selectedVisit.patient.gender,
              uhid: selectedVisit.patient.uhid,
              allergies,
            }}
            tokenNumber={selectedVisit.tokenNumber}
          />

          {/* Allergy Banner with MANDATORY acknowledgment checkbox */}
          {hasAllergies && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Known Patient Allergies: {allergies.join(', ')}</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-red-800 cursor-pointer pt-1">
                <Checkbox
                  checked={allergyAcknowledged}
                  onCheckedChange={(checked) => setAllergyAcknowledged(!!checked)}
                />
                <span>I have reviewed these allergies and ensured no contraindications exist</span>
              </label>
            </div>
          )}

          {/* Vitals Summary Strip */}
          {selectedVisit.vitals?.[0] && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-6 overflow-x-auto text-xs shadow-2xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                Recorded Vitals:
              </span>
              <span>BP: <strong className="text-slate-900">{selectedVisit.vitals[0].bp || '--'}</strong></span>
              <span>Pulse: <strong className="text-slate-900">{selectedVisit.vitals[0].pulse || '--'} bpm</strong></span>
              <span>Temp: <strong className="text-slate-900">{selectedVisit.vitals[0].tempC || '--'} °C</strong></span>
              <span>SpO2: <strong className="text-slate-900">{selectedVisit.vitals[0].spo2 || '--'}%</strong></span>
              <span>Weight: <strong className="text-slate-900">{selectedVisit.vitals[0].weightKg || '--'} kg</strong></span>
            </div>
          )}

          {/* Laboratory Reports to Review if any */}
          {selectedVisit.labOrders?.some((o: any) => o.status === 'RESULT_ENTERED') && (
            <Card className="border-amber-300 bg-amber-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                  <Eye className="h-4 w-4 text-amber-600" />
                  Laboratory Results Ready for Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedVisit.labOrders
                  .filter((o: any) => o.status === 'RESULT_ENTERED')
                  .map((order: any) => (
                    <div key={order.id} className="p-3 bg-white rounded-lg border border-amber-200 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900">{order.labTest?.name}</span>
                        <Badge variant="warning" className="text-[10px]">Result Entered</Badge>
                      </div>
                      <pre className="text-xs bg-slate-50 p-2 rounded border border-slate-100 font-mono overflow-x-auto">
                        {order.result || 'No numeric details'}
                      </pre>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Main Clinical Notes & Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chief Complaint & Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border">
                  Reason for visit: <strong>{selectedVisit.reasonForVisit || 'General consultation'}</strong>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Clinical Examination Notes *</Label>
                  <Textarea
                    id="notes"
                    rows={6}
                    placeholder="Enter patient history, symptoms, physical examination findings..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Working Diagnosis & ICD-10</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="diagnosis">Primary Diagnosis *</Label>
                  <Input
                    id="diagnosis"
                    placeholder="e.g. Acute Upper Respiratory Infection, Type 2 Diabetes"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="h-11 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="icd10">ICD-10 Code (optional)</Label>
                  <Input
                    id="icd10"
                    placeholder="e.g. J06.9, E11.9"
                    value={icd10Code}
                    onChange={(e) => setIcd10Code(e.target.value)}
                    className="h-11 font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investigations Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-sky-600" />
                Laboratory & Radiology Investigations Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {labCatalog.map((test) => {
                  const checked = selectedLabTestIds.includes(test.id);

                  return (
                    <label
                      key={test.id}
                      className={`p-3 rounded-lg border text-xs font-medium cursor-pointer transition flex items-start gap-2 ${
                        checked ? 'bg-sky-50 border-sky-400 text-sky-900' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLabTestIds([...selectedLabTestIds, test.id]);
                          } else {
                            setSelectedLabTestIds(selectedLabTestIds.filter((id) => id !== test.id));
                          }
                        }}
                        className="mt-0.5 rounded text-sky-600"
                      />
                      <div>
                        <p className="font-semibold">{test.name}</p>
                        <span className="text-[10px] text-slate-400">{test.category}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Prescription Builder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" />
                Prescription & Medicines
              </CardTitle>

              {/* Medicine quick catalog picker */}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    const med = medicineCatalog.find((m) => m.id === e.target.value);
                    if (med) handleAddMedicine(med);
                    e.target.value = '';
                  }}
                  className="h-9 px-2 text-xs font-semibold rounded-lg bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  <option value="">+ Add Medicine from Formulary</option>
                  {medicineCatalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.form}) — Stock: {m.stockQty}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {rxItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                  No medicines added to this prescription yet. Pick from the formulary dropdown above.
                </div>
              ) : (
                rxItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs"
                  >
                    <div className="sm:col-span-2">
                      <Label className="text-[10px] text-slate-400">Medicine</Label>
                      <p className="font-semibold text-slate-900">{item.medicineName}</p>
                    </div>

                    <div>
                      <Label className="text-[10px] text-slate-400">Dosage & Frequency</Label>
                      <Input
                        value={item.frequency}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRxItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, frequency: val } : it))
                          );
                        }}
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] text-slate-400">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setRxItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                          );
                        }}
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* ONE Obvious Primary Action Button */}
          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              onClick={handleOpenNextStepModal}
              className="h-14 px-8 text-base font-bold shadow-md bg-sky-600 hover:bg-sky-700 text-white rounded-xl gap-2"
            >
              <span>SAVE & NEXT STEP</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">No patient selected</p>
          <p className="text-xs text-slate-400 mt-1">Select a waiting patient from the queue above to consult.</p>
        </div>
      )}

      {/* "SAVE & NEXT STEP" Modal Dialog */}
      <Dialog open={nextStepModalOpen} onOpenChange={setNextStepModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Consultation • Next Steps</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-500">
              Select all destinations that apply to this visit. Unselected steps will not clutter the patient journey:
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox checked={sendToLab} onCheckedChange={(c) => setSendToLab(!!c)} />
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-sky-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Send to Laboratory ({selectedLabTestIds.length} tests)
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox checked={sendToPharmacy} onCheckedChange={(c) => setSendToPharmacy(!!c)} />
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Send to Pharmacy ({rxItems.length} items)
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox checked={admitPatient} onCheckedChange={(c) => setAdmitPatient(!!c)} />
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Request Inpatient Admission
                  </span>
                </div>
              </label>

              {admitPatient && (
                <div className="pl-7 space-y-1">
                  <Label className="text-xs text-slate-500">Admission Reason</Label>
                  <Input
                    value={admissionReason}
                    onChange={(e) => setAdmissionReason(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox checked={referPatient} onCheckedChange={(c) => setReferPatient(!!c)} />
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Refer to Another Department
                  </span>
                </div>
              </label>

              {referPatient && (
                <div className="pl-7 space-y-2">
                  <select
                    value={referralDeptId}
                    onChange={(e) => setReferralDeptId(e.target.value)}
                    className="h-9 px-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 w-full"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Reason for referral..."
                    value={referralReason}
                    onChange={(e) => setReferralReason(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <Checkbox checked={discharge} onCheckedChange={(c) => setDischarge(!!c)} />
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    Clear for Discharge
                  </span>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setNextStepModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFinalizeConsultation}
              disabled={saving}
              className="h-11 px-6 bg-sky-600 hover:bg-sky-700"
            >
              {saving ? 'Completing...' : 'Save & Move Patient Forward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Completion Animation */}
      <ProcessSuccessAnimation
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/dashboard');
          router.refresh();
        }}
        badgeText="Clinical Consultation Finalized"
        title="Patient Consultation Completed"
        subtitle="Clinical notes saved and investigation/prescription orders have been routed to downstream departments."
        tokenNumber={selectedVisit?.tokenNumber}
        patientName={selectedVisit?.patient?.name}
        departmentName="Consultation Finished"
        primaryActionLabel="Return to Dashboard"
        primaryActionHref="/dashboard"
        secondaryActionLabel="Consultation Workspace"
        onSecondaryAction={() => {
          setShowSuccessModal(false);
          router.refresh();
        }}
      />
    </div>
  );
}
