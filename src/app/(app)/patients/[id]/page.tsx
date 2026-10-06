import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getNextAction } from '@/server/workflow/guidance';
import { PatientIdentityBar } from '@/components/patient/patient-identity-bar';
import { PatientJourney } from '@/components/patient/patient-journey';
import { AllergyBanner } from '@/components/patient/allergy-banner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Phone,
  MapPin,
  User,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Pill,
  CreditCard,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userRole = (session?.user?.role || 'RECEPTIONIST') as any;

  const patient = await db.patient.findUnique({
    where: { id },
    include: {
      visits: {
        include: {
          department: true,
          consultation: true,
          labOrders: { include: { labTest: true } },
          prescriptions: { include: { items: true } },
          admission: { include: { bed: { include: { ward: true } } } },
          invoice: { include: { items: true, payments: true } },
          dischargeRecord: true,
          vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
          flowEvents: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const allergies: string[] = patient.allergies ? JSON.parse(patient.allergies) : [];
  const activeVisit = patient.visits.find((v) => v.status === 'OPEN');

  // Compute smart guidance
  let guidance: any = null;
  if (activeVisit) {
    const tasks = {
      labOrders: activeVisit.labOrders,
      prescriptions: activeVisit.prescriptions,
      admission: activeVisit.admission,
      invoice: activeVisit.invoice,
      consultation: activeVisit.consultation,
      dischargeRecord: activeVisit.dischargeRecord,
      vitals: activeVisit.vitals.length > 0,
    };
    guidance = getNextAction(activeVisit, tasks, userRole);
  }

  return (
    <div className="space-y-6">
      {/* Sticky Patient Identity Bar */}
      <PatientIdentityBar
        patient={{
          name: patient.name,
          ageYears: patient.ageYears,
          gender: patient.gender,
          uhid: patient.uhid,
          allergies,
        }}
        tokenNumber={activeVisit?.tokenNumber}
      />

      {/* Allergy Banner if patient has allergies */}
      {allergies.length > 0 && <AllergyBanner allergies={allergies} />}

      {/* Primary Action Guidance Card */}
      {activeVisit && guidance && (
        <Card className="border border-sky-200 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 shadow-sm rounded-2xl">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-600 animate-pulse" />
                Current Step • {guidance.whereNow}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{guidance.whatNext}</h2>
              <p className="text-xs font-medium text-slate-500">
                Department: <strong className="text-slate-700">{activeVisit.department.name}</strong> • Stage: <strong className="text-slate-700">{activeVisit.stage}</strong> • Token:{' '}
                <strong className="text-sky-600 font-mono text-sm">{activeVisit.tokenNumber}</strong>
              </p>
            </div>

            {guidance.primaryAction ? (
              <Button asChild size="lg" className="h-12 px-6 gap-2 shrink-0 bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-600/20 rounded-xl">
                <Link href={guidance.primaryAction.href}>
                  {guidance.primaryAction.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-sky-200 text-xs font-bold text-sky-800 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>Attended by: {guidance.ownerRole || 'Clinical Staff'}</span>
                </div>
                <Button asChild variant="outline" size="sm" className="h-10 px-4 text-xs font-bold rounded-xl bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs">
                  <Link href="/queue">
                    View Queue
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Journey Timeline */}
      {activeVisit && activeVisit.flowEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Visit Journey Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientJourney
              events={activeVisit.flowEvents.map((e) => ({
                type: e.type,
                stage: e.stage || undefined,
                actorName: e.actorName,
                metadata: e.metadata,
                createdAt: e.createdAt.toISOString(),
              }))}
              currentStage={activeVisit.stage}
            />
          </CardContent>
        </Card>
      )}

      {/* Patient Demographic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Patient Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Full Name</span>
              <span className="font-semibold text-slate-900">{patient.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">UHID</span>
              <span className="font-mono font-semibold text-slate-900">{patient.uhid}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Age & Gender</span>
              <span className="font-medium text-slate-900">
                {patient.ageYears} years • {patient.gender}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone Number</span>
              <span className="font-medium text-slate-900">{patient.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Address</span>
              <span className="font-medium text-slate-900">{patient.address || 'Not provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Latest Clinical Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Latest Vitals & Clinical Summary
            </CardTitle>
            <HeartPulse className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {activeVisit?.vitals?.[0] ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400">BP</p>
                    <p className="font-bold text-slate-800">{activeVisit.vitals[0].bp || '--'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400">Pulse</p>
                    <p className="font-bold text-slate-800">
                      {activeVisit.vitals[0].pulse ? `${activeVisit.vitals[0].pulse} bpm` : '--'}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400">Temp</p>
                    <p className="font-bold text-slate-800">
                      {activeVisit.vitals[0].tempC ? `${activeVisit.vitals[0].tempC} °C` : '--'}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[11px] text-slate-400">SpO2</p>
                    <p className="font-bold text-slate-800">
                      {activeVisit.vitals[0].spo2 ? `${activeVisit.vitals[0].spo2}%` : '--'}
                    </p>
                  </div>
                </div>
                {activeVisit.consultation?.diagnosis && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400">Doctor Diagnosis:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {activeVisit.consultation.diagnosis}
                      {activeVisit.consultation.icd10Code && (
                        <span className="ml-1 text-xs text-slate-500 font-mono">
                          ({activeVisit.consultation.icd10Code})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400 text-center py-4">No vitals recorded for this visit yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visit History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {patient.visits.map((v) => (
              <div key={v.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {v.department.name}
                    </span>
                    <Badge variant="outline" className="text-xs font-mono">
                      Token {v.tokenNumber}
                    </Badge>
                    <Badge
                      variant={v.status === 'COMPLETED' ? 'success' : 'info'}
                      className="text-xs"
                    >
                      {v.stage}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateTime(v.createdAt)} • Reason: {v.reasonForVisit || 'Routine'}
                  </p>
                </div>

                {v.invoice && (
                  <span className="text-xs font-semibold text-slate-700">
                    Bill: {formatCurrency(v.invoice.totalPaise)} ({v.invoice.status})
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
