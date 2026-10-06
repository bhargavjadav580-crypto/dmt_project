'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Stepper } from '@/components/shared/stepper';
import { ProcessSuccessAnimation } from '@/components/shared/process-success-animation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { registerPatient, findDuplicates } from '@/features/patients/actions';
import { createVisit } from '@/features/visits/actions';
import {
  UserPlus,
  Search,
  AlertCircle,
  CheckCircle2,
  Printer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Stethoscope,
  Heart,
  Baby,
  Activity,
  Flame,
} from 'lucide-react';

interface Department {
  id: string;
  code: string;
  name: string;
  type: string;
  tokenPrefix: string;
}

export function RegisterWizardClient({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 Demographics
  const [name, setName] = useState('');
  const [ageYears, setAgeYears] = useState<string>('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  // Duplicate candidates
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Step 3 Visit Details
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    departments.find((d) => d.code === 'GENERAL_OPD')?.id || departments[0]?.id || ''
  );
  const [reasonForVisit, setReasonForVisit] = useState('Routine consultation');

  // Step 4 Confirmation Result
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [createdUhid, setCreatedUhid] = useState<string | null>(null);
  const [createdPatientName, setCreatedPatientName] = useState<string | null>(null);

  // Check duplicates when name or phone changes
  const handleCheckDuplicates = async (candidateName: string, candidatePhone: string) => {
    if ((candidateName.trim().length >= 3) || candidatePhone.trim().length === 10) {
      const res = await findDuplicates(candidateName, candidatePhone, ageYears ? parseInt(ageYears) : undefined);
      if (res.ok && res.data.length > 0) {
        setDuplicateMatches(res.data);
      } else {
        setDuplicateMatches([]);
      }
    }
  };

  const handleQuickEmergency = () => {
    setIsEmergency(true);
    setName('Unknown Patient (Emergency)');
    setAgeYears('40');
    setGender('MALE');
    const emergencyDept = departments.find((d) => d.code === 'EMERGENCY') || departments[0];
    if (emergencyDept) setSelectedDeptId(emergencyDept.id);
    setReasonForVisit('Acute emergency trauma / stabilization');
    setStep(3); // jump directly to visit confirmation
  };

  const handleCreateVisitForPatient = async (patientId: string, patientName: string, uhid: string) => {
    setLoading(true);
    setError(null);
    try {
      const visitRes = await createVisit(
        patientId,
        selectedDeptId,
        isEmergency ? 'EMERGENCY' : 'OPD',
        reasonForVisit
      );

      if (!visitRes.ok) {
        setError(visitRes.error.messageKey);
        setLoading(false);
        return;
      }

      setCreatedToken(visitRes.data.tokenNumber);
      setCreatedUhid(uhid);
      setCreatedPatientName(patientName);
      setStep(4);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate visit token.');
    } finally {
      setLoading(false);
    }
  };

  const handleStepSubmit = async () => {
    setError(null);

    if (step === 2) {
      // Validate demographics
      if (!name.trim()) {
        setError('Please enter patient full name.');
        return;
      }
      if (!ageYears || isNaN(parseInt(ageYears)) || parseInt(ageYears) < 0) {
        setError('Please enter a valid age in years.');
        return;
      }
      if (phone && !/^[0-9]{10}$/.test(phone.trim())) {
        setError('Phone number needs 10 digits. Example: 98765 43210');
        return;
      }

      setStep(3);
    } else if (step === 3) {
      // Create new patient (if not chosen from duplicates) then create visit
      setLoading(true);
      try {
        let pId = selectedPatientId;
        let pName = name;
        let pUhid = '';

        if (!pId) {
          const parsedAllergies = allergiesText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          const regRes = await registerPatient({
            name: name.trim(),
            ageYears: parseInt(ageYears),
            gender,
            phone: phone.trim() || null,
            address: address.trim() || null,
            allergies: parsedAllergies,
            isUnidentified: isEmergency && name.includes('Unknown'),
          });

          if (!regRes.ok) {
            setError(regRes.error.messageKey);
            setLoading(false);
            return;
          }

          pId = regRes.data.id;
          pName = regRes.data.name;
          pUhid = regRes.data.uhid;
        }

        await handleCreateVisitForPatient(pId!, pName, pUhid);
      } catch (err: any) {
        setError(err?.message || 'Error completing patient registration.');
        setLoading(false);
      }
    }
  };

  const resetWizard = () => {
    setName('');
    setAgeYears('');
    setGender('MALE');
    setPhone('');
    setAddress('');
    setAllergiesText('');
    setIsEmergency(false);
    setDuplicateMatches([]);
    setSelectedPatientId(null);
    setCreatedToken(null);
    setCreatedUhid(null);
    setCreatedPatientName(null);
    setStep(1);
  };

  const stepsList = [
    { title: 'Type' },
    { title: 'Patient Details' },
    { title: 'Visit Reason' },
    { title: 'Token' },
  ];

  const getDeptIcon = (code: string) => {
    switch (code) {
      case 'CARDIOLOGY':
        return Heart;
      case 'PEDIATRICS':
        return Baby;
      case 'EMERGENCY':
        return Flame;
      default:
        return Stethoscope;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Patient</h1>
        <p className="text-sm text-slate-500">
          Assign an appointment token and direct patient to queue
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <Stepper steps={stepsList} currentStep={step} />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Registration Type */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-4"
          >
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Is this patient already registered?</CardTitle>
                <CardDescription>
                  Search existing hospital records by phone or UHID, or register a new walk-in patient.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="p-6 text-left rounded-2xl border-2 border-slate-200 hover:border-sky-500 hover:bg-gradient-to-br hover:from-white hover:to-sky-50/70 card-hover-lift transition-all group flex flex-col justify-between h-48 bg-white shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-xs">
                        <UserPlus className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border-sky-200">
                        Walk-in Intake
                      </Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">New Patient</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      First time visiting this hospital. Generate a new UHID and appointment queue token.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-sky-600 flex items-center gap-1.5 mt-2 group-hover:translate-x-1 transition-transform">
                    Continue to details <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/patients')}
                  className="p-6 text-left rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/70 card-hover-lift transition-all group flex flex-col justify-between h-48 bg-white shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                        <Search className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-200">
                        Record Search
                      </Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Existing Patient</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Patient has visited before or holds an existing UHID or previous visit history.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 mt-2 group-hover:translate-x-1 transition-transform">
                    Search patient records <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </CardContent>
            </Card>

            {/* Quick Emergency Option */}
            <div className="p-4 bg-gradient-to-r from-red-50 via-rose-50 to-red-100/50 border border-red-200 rounded-2xl flex items-center justify-between shadow-xs card-hover-lift">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/25 animate-pulse">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-red-950 text-sm">Emergency / Unidentified Patient</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Immediate triage token bypass without asking for address or full ID.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleQuickEmergency}
                className="gap-1.5 shrink-0 shadow-sm bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4 rounded-xl"
              >
                Quick Emergency
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Demographics & Duplicate Check */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Patient Demographics</CardTitle>
                <CardDescription>
                  Basic identification details. Duplicate checks run automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Full Name *</Label>
                  <Input
                    id="patientName"
                    placeholder="e.g. Ramesh Chandra"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      handleCheckDuplicates(e.target.value, phone);
                    }}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (in years) *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="e.g. 45"
                      value={ageYears}
                      onChange={(e) => setAgeYears(e.target.value)}
                      className="h-12"
                      min="0"
                      max="150"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`h-12 rounded-xl border text-sm font-semibold transition ${
                            gender === g
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="phone">Phone Number</Label>
                    <span className="text-xs text-slate-400">10-digit mobile</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(cleaned);
                      handleCheckDuplicates(name, cleaned);
                    }}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies (comma separated)</Label>
                  <Input
                    id="allergies"
                    placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Possible Duplicate Match Warning with animation */}
                {duplicateMatches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-2 shadow-xs"
                  >
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Possible match found: Is this the same person?
                    </div>
                    <div className="space-y-2 pt-1">
                      {duplicateMatches.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between shadow-xs"
                        >
                          <div>
                            <p className="font-bold text-sm text-slate-900">{m.name}</p>
                            <p className="text-xs text-slate-500">
                              UHID: <span className="font-semibold text-slate-700">{m.uhid}</span> • Age: {m.ageYears}y • {m.gender}
                              {m.phone ? ` • Phone: ${m.phone}` : ''}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg"
                            onClick={() => {
                              setSelectedPatientId(m.id);
                              setName(m.name);
                              setAgeYears(m.ageYears.toString());
                              setGender(m.gender);
                              setStep(3);
                            }}
                          >
                            Use this patient
                          </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">
                  Back
                </Button>
                <Button onClick={handleStepSubmit} size="lg" className="h-12 px-6 rounded-xl font-bold bg-sky-600 hover:bg-sky-700">
                  Continue to Visit Details
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* STEP 3: Department Selection & Visit Reason */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Why is the patient visiting?</CardTitle>
                <CardDescription>
                  Select the destination clinic department for this visit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {departments.map((dept) => {
                    const Icon = getDeptIcon(dept.code);
                    const isSelected = selectedDeptId === dept.id;

                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setSelectedDeptId(dept.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 card-hover-lift ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/80 shadow-md ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">Prefix {dept.tokenPrefix}-XXX</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Chief Complaint / Reason for Visit</Label>
                  <Input
                    id="reason"
                    placeholder="e.g. Fever and body ache for 3 days"
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    className="h-12"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl">
                  Back
                </Button>
                <Button onClick={handleStepSubmit} size="lg" className="h-12 px-6 rounded-xl font-bold bg-sky-600 hover:bg-sky-700" disabled={loading}>
                  {loading ? 'Issuing Token...' : 'Confirm & Issue Token'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: Token Confirmation with animated celebration */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ProcessSuccessAnimation
              isInline={true}
              badgeText="Registration Completed"
              title="Patient Registered Successfully"
              subtitle="Direct the patient to the department waiting area. Their token will be called on the TV display."
              tokenNumber={createdToken || undefined}
              departmentName={departments.find((d) => d.id === selectedDeptId)?.name}
              patientName={createdPatientName || undefined}
              uhid={createdUhid ? `UHID: ${createdUhid}` : undefined}
              showPrint={true}
              secondaryActionLabel="Register Another Patient"
              onSecondaryAction={resetWizard}
              primaryActionLabel="View Department Queue"
              primaryActionHref="/queue"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
