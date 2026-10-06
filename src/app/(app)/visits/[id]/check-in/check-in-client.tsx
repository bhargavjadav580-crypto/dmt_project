'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Building2,
  UserCheck,
  AlertTriangle,
  Send,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkInPatient } from '@/features/visits/actions';

interface CheckInClientProps {
  visit: {
    id: string;
    visitNo: string;
    stage: string;
    priority: string;
    tokenNumber: string;
    reasonForVisit?: string | null;
    departmentName: string;
    departmentCode: string;
    patient: {
      id: string;
      name: string;
      uhid: string;
      ageYears: number;
      gender: string;
      phone?: string | null;
      allergies: string[];
    };
  };
}

export function CheckInClient({ visit }: CheckInClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(visit.stage === 'WAITING' || visit.stage === 'IN_CONSULTATION');
  const [error, setError] = useState<string | null>(null);

  const isAlreadyInQueue = visit.stage !== 'REGISTERED' && visit.stage !== 'CHECKED_IN';

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await checkInPatient(visit.id);
      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(res.error?.messageKey || 'Failed to complete check-in');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred during check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Back button */}
      <div>
        <Link
          href={`/patients/${visit.patient.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patient Profile
        </Link>
      </div>

      {/* Main Check-In Card */}
      <Card className="rounded-3xl border-slate-200/80 shadow-lg overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 p-6 sm:p-8 text-white relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-100 flex items-center gap-1.5 mb-1">
                <UserCheck className="h-4 w-4" />
                Hospital Reception • Check-In Desk
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Patient Check-In</h1>
              <p className="text-sm text-sky-100 mt-1">
                Confirm arrival and route patient to the active waiting queue
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center min-w-28">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-200 block">Token</span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-white">{visit.tokenNumber}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {(success || isAlreadyInQueue) && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3"
            >
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-base">Check-In Completed!</h4>
                <p className="text-sm text-emerald-700 mt-0.5">
                  The patient has been checked in and is active in the {visit.departmentName} waiting queue.
                  Their token will be displayed on the waiting room TV monitor.
                </p>
              </div>
            </motion.div>
          )}

          {/* Patient Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Patient Identity</span>
              <div className="text-lg font-bold text-slate-900">{visit.patient.name}</div>
              <div className="text-xs text-slate-500 font-medium space-x-2">
                <span>UHID: <strong>{visit.patient.uhid}</strong></span>
                <span>•</span>
                <span>{visit.patient.ageYears} yrs / {visit.patient.gender}</span>
              </div>
              {visit.patient.phone && (
                <div className="text-xs text-slate-500">Phone: {visit.patient.phone}</div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Visit Routing</span>
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Building2 className="h-4 w-4 text-sky-600" />
                {visit.departmentName}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold bg-white">
                  Priority: {visit.priority}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold bg-white">
                  Visit #{visit.visitNo}
                </Badge>
              </div>
              {visit.reasonForVisit && (
                <div className="text-xs text-slate-500 truncate">
                  Reason: {visit.reasonForVisit}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 sm:p-8 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-xl h-12 px-5">
            <Link href={`/patients/${visit.patient.id}`}>View Patient Profile</Link>
          </Button>

          {!isAlreadyInQueue && !success ? (
            <Button
              onClick={handleCheckIn}
              disabled={loading}
              size="lg"
              className="rounded-xl h-12 px-6 font-bold bg-sky-600 hover:bg-sky-700 text-white gap-2 shadow-md shadow-sky-600/20"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Confirm Check-In & Send to Queue
                </>
              )}
            </Button>
          ) : (
            <Button asChild size="lg" className="rounded-xl h-12 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-600/20">
              <Link href="/queue">
                View Department Queue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
