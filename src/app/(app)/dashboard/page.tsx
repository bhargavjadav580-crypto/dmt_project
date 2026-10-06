import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { getNextAction } from '@/server/workflow/guidance';
import { StatCard } from '@/components/shared/stat-card';
import { AttentionCard } from '@/components/shared/attention-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Users,
  Clock,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Pill,
  BedDouble,
  CreditCard,
  UserPlus,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;
  const userRole = user?.role || 'RECEPTIONIST';

  // 1. Fetch live metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    waitingCount,
    inConsultationCount,
    emergencyCount,
    labPendingCount,
    pharmacyPendingCount,
    billingPendingCount,
    admittedCount,
    readyForDischargeCount,
  ] = await Promise.all([
    db.queueEntry.count({ where: { status: 'WAITING' } }),
    db.visit.count({ where: { stage: 'IN_CONSULTATION' } }),
    db.visit.count({ where: { type: 'EMERGENCY', status: 'OPEN' } }),
    db.labOrder.count({ where: { status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] } } }),
    db.prescription.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
    db.invoice.count({ where: { status: 'PENDING' } }),
    db.admission.count({ where: { status: 'ADMITTED' } }),
    db.visit.count({ where: { stage: 'READY_FOR_DISCHARGE' } }),
  ]);

  // 2. Fetch open visits to compute "What needs attention?" cards
  const openVisits = await db.visit.findMany({
    where: { status: 'OPEN' },
    include: {
      patient: true,
      department: true,
      labOrders: true,
      prescriptions: { include: { items: true } },
      admission: true,
      invoice: true,
      consultation: true,
      dischargeRecord: true,
      vitals: true,
      queueEntries: { orderBy: { enteredAt: 'asc' }, take: 1 },
    },
    take: 15,
    orderBy: { createdAt: 'asc' },
  });

  // 3. Fetch comprehensive sample patient for full feature showcase
  const samplePatient = (await db.patient.findFirst({
    where: {
      deletedAt: null,
      visits: {
        some: {
          consultation: { isNot: null },
        },
      },
    },
    include: {
      visits: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          consultation: true,
          labOrders: { include: { labTest: true } },
          prescriptions: { include: { items: true } },
          invoice: true,
          vitals: { take: 1 },
          dischargeRecord: true,
        },
      },
    },
  })) || (await db.patient.findFirst({
    where: { deletedAt: null },
    include: {
      visits: {
        take: 1,
        include: {
          department: true,
        },
      },
    },
  }));

  // Calculate guidance and attention items
  const attentionItems: any[] = [];
  const now = Date.now();

  for (const v of openVisits) {
    const tasks = {
      labOrders: v.labOrders,
      prescriptions: v.prescriptions,
      admission: v.admission,
      invoice: v.invoice,
      consultation: v.consultation,
      dischargeRecord: v.dischargeRecord,
      vitals: v.vitals.length > 0,
    };

    const guidance = getNextAction(v, tasks, userRole as any);

    // Calculate wait time
    const enteredAt = v.queueEntries[0]?.enteredAt ? new Date(v.queueEntries[0].enteredAt).getTime() : new Date(v.createdAt).getTime();
    const waitMinutes = Math.floor((now - enteredAt) / 60000);

    let variant: 'warning' | 'danger' | 'info' = 'info';
    let urgencyMessage = guidance.whatNext;

    if (v.priority === 'EMERGENCY') {
      variant = 'danger';
      urgencyMessage = `🚨 Emergency priority! ${guidance.whatNext}`;
    } else if (v.priority === 'UNASSESSED') {
      variant = 'danger';
      urgencyMessage = 'Awaiting triage assessment - set priority';
    } else if (waitMinutes > 45) {
      variant = 'danger';
      urgencyMessage = `Waiting over ${waitMinutes} mins — needs attention`;
    } else if (waitMinutes > 20) {
      variant = 'warning';
      urgencyMessage = `Waiting ${waitMinutes} mins`;
    }

    if (guidance.primaryAction || variant !== 'info') {
      attentionItems.push({
        id: v.id,
        patientName: v.patient.name,
        uhid: v.patient.uhid,
        tokenNumber: v.tokenNumber,
        departmentName: v.department.name,
        message: urgencyMessage,
        actionLabel: guidance.primaryAction?.label || 'Open Patient',
        actionHref: guidance.primaryAction?.href || `/patients/${v.patient.id}`,
        variant,
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Rich Healthcare Hero Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-sky-900/10 border border-sky-500/30">
        {/* Decorative subtle ambient lights */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-44 h-44 rounded-full bg-teal-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-sky-100 text-xs font-semibold uppercase tracking-wider border border-white/20">
              {userRole} Station
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-sky-100 font-medium">Station Active</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome, {user?.name}
          </h1>

          <p className="text-sky-100 text-sm max-w-xl leading-relaxed">
            {waitingCount > 0
              ? `${waitingCount} patients currently waiting across departments. Review prioritized triage items below.`
              : 'All department queues are currently up to date. Ready for patient intake.'}
          </p>
        </div>

        {/* Action button in high-contrast solid white */}
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          {['RECEPTIONIST', 'ADMIN'].includes(userRole) && (
            <Button asChild size="lg" className="h-12 px-6 gap-2 bg-white text-sky-800 hover:bg-sky-50 hover:text-sky-900 font-bold shadow-lg shadow-black/10 border-0 rounded-xl transition-transform hover:-translate-y-0.5">
              <Link href="/patients/new">
                <UserPlus className="h-5 w-5 text-sky-600" />
                Register Patient
              </Link>
            </Button>
          )}

          {['DOCTOR'].includes(userRole) && (
            <Button asChild size="lg" className="h-12 px-6 gap-2 bg-white text-sky-800 hover:bg-sky-50 hover:text-sky-900 font-bold shadow-lg shadow-black/10 border-0 rounded-xl transition-transform hover:-translate-y-0.5">
              <Link href="/consultation">
                <Stethoscope className="h-5 w-5 text-sky-600" />
                Start Consultation
              </Link>
            </Button>
          )}

          {['NURSE'].includes(userRole) && (
            <Button asChild size="lg" className="h-12 px-6 gap-2 bg-white text-sky-800 hover:bg-sky-50 hover:text-sky-900 font-bold shadow-lg shadow-black/10 border-0 rounded-xl transition-transform hover:-translate-y-0.5">
              <Link href="/nurse">
                <HeartPulse className="h-5 w-5 text-sky-600" />
                Open Triage & Vitals
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Patients Waiting"
          value={waitingCount}
          actionLabel="View Queue"
          actionHref="/queue"
          variant="warning"
        />

        <StatCard
          icon={Stethoscope}
          label="In Consultation"
          value={inConsultationCount}
          actionLabel="Consultations"
          actionHref="/consultation"
          variant="default"
        />

        <StatCard
          icon={AlertTriangle}
          label="Emergency Active"
          value={emergencyCount}
          actionLabel="Emergency Queue"
          actionHref="/queue?dept=EMERGENCY"
          variant={emergencyCount > 0 ? 'danger' : 'default'}
        />

        <StatCard
          icon={BedDouble}
          label="Inpatients Admitted"
          value={admittedCount}
          actionLabel="Bed Board"
          actionHref="/admissions"
          variant="indigo"
        />
      </div>

      {/* Department Quick Overviews with distinct colored accents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-white via-purple-50/20 to-purple-100/40 p-5 rounded-2xl border border-purple-200/80 shadow-xs card-hover-lift flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider">
              <FlaskConical className="h-4 w-4" />
              <span>Laboratory</span>
            </div>
            <p className="text-2xl font-black text-purple-950 mt-1">{labPendingCount} Pending</p>
            <p className="text-xs text-purple-600/80 mt-0.5">Tests awaiting sample/results</p>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-white/90 hover:bg-white text-purple-700 border-purple-200 shadow-xs font-semibold">
            <Link href="/lab">Open Lab</Link>
          </Button>
        </div>

        <div className="bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/40 p-5 rounded-2xl border border-emerald-200/80 shadow-xs card-hover-lift flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <Pill className="h-4 w-4" />
              <span>Pharmacy</span>
            </div>
            <p className="text-2xl font-black text-emerald-950 mt-1">{pharmacyPendingCount} Prescriptions</p>
            <p className="text-xs text-emerald-600/80 mt-0.5">Awaiting medicine dispensing</p>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-white/90 hover:bg-white text-emerald-700 border-emerald-200 shadow-xs font-semibold">
            <Link href="/pharmacy">Dispense</Link>
          </Button>
        </div>

        <div className="bg-gradient-to-br from-white via-sky-50/20 to-sky-100/40 p-5 rounded-2xl border border-sky-200/80 shadow-xs card-hover-lift flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider">
              <CreditCard className="h-4 w-4" />
              <span>Billing & Discharge</span>
            </div>
            <p className="text-2xl font-black text-sky-950 mt-1">{readyForDischargeCount} Ready</p>
            <p className="text-xs text-sky-600/80 mt-0.5">{billingPendingCount} pending payment</p>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-white/90 hover:bg-white text-sky-700 border-sky-200 shadow-xs font-semibold">
            <Link href="/discharge">Clearance</Link>
          </Button>
        </div>
      </div>

      {/* ⭐ All-Features Interactive Sample Patient Showcase */}
      {samplePatient && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-sky-400/25">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider border border-sky-400/30 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  Full Feature Sample Journey
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  UHID: <span className="text-slate-200 font-bold">{samplePatient.uhid}</span>
                </span>
                {samplePatient.visits[0]?.tokenNumber && (
                  <span className="text-xs text-slate-400 font-medium">
                    • Token: <span className="text-sky-300 font-bold">{samplePatient.visits[0].tokenNumber}</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {samplePatient.name} — Complete Clinical Journey
              </h3>

              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Click below to inspect how this patient connects all 8 hospital modules: registration, nurse vitals, consultation with ICD-10 notes, lab diagnostic parameters, pharmacy stock dispensing, invoice clearance, and the 5-point discharge hard-stop.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Button asChild size="lg" className="bg-sky-500 hover:bg-sky-400 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-sky-500/30 gap-2">
                <Link href={`/patients/${samplePatient.id}`}>
                  <span>Open Full Journey</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 8-Step Interactive Architecture Badges */}
          <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { num: '1', title: 'Intake', subtitle: 'UHID & Token', color: 'text-sky-400', href: '/patients/new' },
              { num: '2', title: 'Triage', subtitle: 'Vitals & Priority', color: 'text-emerald-400', href: '/nurse' },
              { num: '3', title: 'Doctor', subtitle: 'ICD-10 & Notes', color: 'text-sky-400', href: '/consultation' },
              { num: '4', title: 'Lab Orders', subtitle: 'CBC & Results', color: 'text-purple-400', href: '/lab' },
              { num: '5', title: 'Pharmacy', subtitle: 'Stock Deduct', color: 'text-emerald-400', href: '/pharmacy' },
              { num: '6', title: 'Inpatient', subtitle: 'Bed Board', color: 'text-indigo-400', href: '/admissions' },
              { num: '7', title: 'Cashier', subtitle: 'Paise Invoicing', color: 'text-amber-400', href: '/billing' },
              { num: '8', title: 'Discharge', subtitle: '5/5 Hard-stop', color: 'text-teal-400', href: '/discharge' },
            ].map((stepItem) => (
              <Link
                key={stepItem.num}
                href={stepItem.href}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 transition-all text-center group"
              >
                <span className={`text-xs font-black block ${stepItem.color}`}>
                  Step {stepItem.num}
                </span>
                <span className="text-xs font-bold text-white block mt-0.5 group-hover:text-sky-300 transition-colors">
                  {stepItem.title}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {stepItem.subtitle}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* "What Needs Attention?" Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">What needs attention?</h2>
            <p className="text-sm text-slate-500">
              Action items prioritized by urgency, triage status, and waiting thresholds
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {attentionItems.length} Actionable Items
          </Badge>
        </div>

        {attentionItems.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <p className="text-slate-600 font-medium">All patients are being attended to.</p>
            <p className="text-slate-400 text-sm mt-1">No bottlenecks or excessive wait times detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attentionItems.slice(0, 6).map((item) => (
              <AttentionCard
                key={item.id}
                patientName={item.patientName}
                uhid={item.uhid}
                tokenNumber={item.tokenNumber}
                message={item.message}
                actionLabel={item.actionLabel}
                actionHref={item.actionHref}
                variant={item.variant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
