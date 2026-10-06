'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  getQueue,
  callNextPatient,
  callPatient,
  skipPatient,
  recallPatient,
  completeQueueEntry,
  startConsultationFromQueue,
  getEstimatedWait,
  getNowServing,
} from '@/features/queue/actions';
import {
  Volume2,
  Clock,
  User,
  ArrowRight,
  Flame,
  SkipForward,
  RotateCcw,
  CheckCircle,
  Stethoscope,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Department {
  id: string;
  code: string;
  name: string;
  tokenPrefix: string;
}

export function QueueManagerClient({
  departments,
  initialDepartmentId,
}: {
  departments: Department[];
  initialDepartmentId: string;
}) {
  const router = useRouter();
  const [selectedDeptId, setSelectedDeptId] = useState(initialDepartmentId);
  const [queueData, setQueueData] = useState<{
    waiting: any[];
    called: any[];
    skipped: any[];
    completed: any[];
    inConsultation: any[];
  }>({
    waiting: [],
    called: [],
    skipped: [],
    completed: [],
    inConsultation: [],
  });

  const [nowServing, setNowServing] = useState<any>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue data
  const loadQueue = useCallback(async () => {
    try {
      const [queueRes, servingRes, waitRes] = await Promise.all([
        getQueue(selectedDeptId),
        getNowServing(selectedDeptId),
        getEstimatedWait(selectedDeptId),
      ]);

      if (queueRes.ok) {
        setQueueData(queueRes.data);
      }
      if (servingRes.ok) {
        setNowServing(servingRes.data);
      }
      if (waitRes.ok) {
        setEstimatedWait(waitRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching queue:', err);
    }
  }, [selectedDeptId]);

  // Initial fetch and 5s real-time polling
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  // Primary action: CALL NEXT PATIENT
  const handleCallNext = async () => {
    setActionInProgress('callNext');
    setError(null);
    try {
      const res = await callNextPatient(selectedDeptId);
      if (res.ok && res.data) {
        await loadQueue();
      } else if (!res.ok) {
        setError(res.error.messageKey);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCallSpecific = async (id: string) => {
    setActionInProgress(id);
    try {
      await callPatient(id);
      await loadQueue();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSkip = async (id: string) => {
    setActionInProgress(id);
    try {
      await skipPatient(id);
      await loadQueue();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRecall = async (id: string) => {
    setActionInProgress(id);
    try {
      await recallPatient(id);
      await loadQueue();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStartConsultation = async (id: string) => {
    setActionInProgress(id);
    try {
      const res = await startConsultationFromQueue(id);
      if (res.ok) {
        router.push('/consultation');
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionInProgress(id);
    try {
      await completeQueueEntry(id);
      await loadQueue();
    } finally {
      setActionInProgress(null);
    }
  };

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  return (
    <div className="space-y-6">
      {/* Department Selector & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Department Queue</h1>
          <p className="text-sm text-slate-500">
            Live patient calling and queue flow management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="h-11 px-3 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.tokenPrefix})
              </option>
            ))}
          </select>

          <Button asChild variant="outline" size="sm" className="h-11 gap-1.5">
            <Link href={`/display/${activeDept.code}`} target="_blank">
              <span>TV Display</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Banner: Now Serving + Big Call Next Button */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Now Serving Card */}
        <Card className="lg:col-span-2 border-sky-200 bg-gradient-to-r from-sky-50 to-white shadow-xs">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-sky-700 uppercase tracking-widest flex items-center gap-1.5">
                <Volume2 className="h-4 w-4" />
                Now Serving at Station
              </span>
              <p className="text-4xl sm:text-5xl font-black text-sky-900 tracking-tight mt-1">
                {nowServing?.visit?.tokenNumber || 'No patient called'}
              </p>
              {nowServing?.visit?.patient && (
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  {nowServing.visit.patient.name} • Age {nowServing.visit.patient.ageYears}y
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              {estimatedWait !== null ? (
                <Badge variant="outline" className="text-xs bg-white text-slate-700 px-3 py-1">
                  Estimated wait: about {estimatedWait} min (rolling avg)
                </Badge>
              ) : (
                <span className="text-xs text-slate-400">Waiting queue active</span>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {queueData.waiting.length} waiting • {queueData.skipped.length} skipped
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ONE Obvious Primary Action: Giant CALL NEXT PATIENT Button */}
        <div className="flex flex-col justify-center">
          <Button
            size="lg"
            onClick={handleCallNext}
            disabled={actionInProgress === 'callNext' || queueData.waiting.length === 0}
            className="h-24 w-full text-lg font-bold shadow-md bg-sky-600 hover:bg-sky-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1 touch-target-lg"
          >
            <div className="flex items-center gap-2">
              <Volume2 className="h-6 w-6" />
              <span>CALL NEXT PATIENT</span>
            </div>
            <span className="text-xs font-normal text-sky-100">
              {queueData.waiting.length > 0
                ? `${queueData.waiting.length} waiting in line`
                : 'No patients in waiting line'}
            </span>
          </Button>
        </div>
      </div>

      {/* Tabs: Waiting · Skipped · In Consultation · Done */}
      <Tabs defaultValue="waiting" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="waiting" className="rounded-lg font-semibold text-xs sm:text-sm">
            Waiting ({queueData.waiting.length})
          </TabsTrigger>
          <TabsTrigger value="called" className="rounded-lg font-semibold text-xs sm:text-sm">
            Called ({queueData.called.length})
          </TabsTrigger>
          <TabsTrigger value="consultation" className="rounded-lg font-semibold text-xs sm:text-sm">
            In Consultation ({queueData.inConsultation.length})
          </TabsTrigger>
          <TabsTrigger value="skipped" className="rounded-lg font-semibold text-xs sm:text-sm">
            Skipped ({queueData.skipped.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg font-semibold text-xs sm:text-sm">
            Completed Today ({queueData.completed.length})
          </TabsTrigger>
        </TabsList>

        {/* WAITING TAB */}
        <TabsContent value="waiting" className="space-y-3">
          {queueData.waiting.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-semibold text-slate-700">No patients waiting in queue</p>
              <p className="text-xs text-slate-400 mt-1">
                New walk-in or appointment check-ins will appear here automatically.
              </p>
            </div>
          ) : (
            queueData.waiting.map((entry, index) => {
              const p = entry.visit.patient;
              const isEmergency = entry.priority === 'EMERGENCY';
              const isUnassessed = entry.priority === 'UNASSESSED';

              return (
                <Card
                  key={entry.id}
                  className={`border transition ${
                    isEmergency
                      ? 'border-red-400 bg-red-50/40'
                      : isUnassessed
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-lg">
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold font-mono text-sky-700">
                            {entry.visit.tokenNumber}
                          </span>
                          <span className="font-semibold text-slate-900">{p.name}</span>
                          {isEmergency && (
                            <Badge variant="danger" className="text-xs">
                              🚨 EMERGENCY
                            </Badge>
                          )}
                          {isUnassessed && (
                            <Badge variant="warning" className="text-xs">
                              Awaiting Assessment
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Age: {p.ageYears}y • UHID: {p.uhid} • Waiting since{' '}
                          {new Date(entry.enteredAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSkip(entry.id)}
                        disabled={actionInProgress === entry.id}
                        className="text-xs"
                      >
                        <SkipForward className="h-3.5 w-3.5 mr-1" />
                        Skip
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleCallSpecific(entry.id)}
                        disabled={actionInProgress === entry.id}
                        className="text-xs bg-sky-600 hover:bg-sky-700"
                      >
                        <Volume2 className="h-3.5 w-3.5 mr-1" />
                        Call Patient
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* CALLED TAB */}
        <TabsContent value="called" className="space-y-3">
          {queueData.called.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              No patients currently in called state.
            </div>
          ) : (
            queueData.called.map((entry) => (
              <Card key={entry.id} className="border-sky-300 bg-sky-50/20">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-sky-700">
                        {entry.visit.tokenNumber}
                      </span>
                      <span className="font-semibold text-slate-900">{entry.visit.patient.name}</span>
                      <Badge variant="info">CALLED</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Called at{' '}
                      {entry.calledAt ? new Date(entry.calledAt).toLocaleTimeString() : 'Recently'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSkip(entry.id)}
                      className="text-xs"
                    >
                      <SkipForward className="h-3.5 w-3.5 mr-1" />
                      Skip
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleStartConsultation(entry.id)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1" />
                      Start Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* IN CONSULTATION TAB */}
        <TabsContent value="consultation" className="space-y-3">
          {queueData.inConsultation.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              No consultations actively in progress.
            </div>
          ) : (
            queueData.inConsultation.map((entry) => (
              <Card key={entry.id} className="border-emerald-300 bg-emerald-50/20">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-emerald-700">
                        {entry.visit.tokenNumber}
                      </span>
                      <span className="font-semibold text-slate-900">{entry.visit.patient.name}</span>
                      <Badge variant="success">IN CONSULTATION</Badge>
                    </div>
                  </div>

                  <Button asChild size="sm" className="text-xs">
                    <Link href="/consultation">
                      Open Consultation <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* SKIPPED TAB */}
        <TabsContent value="skipped" className="space-y-3">
          {queueData.skipped.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              No skipped patients.
            </div>
          ) : (
            queueData.skipped.map((entry) => (
              <Card key={entry.id} className="border-slate-200 bg-slate-50/50">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-slate-600">
                        {entry.visit.tokenNumber}
                      </span>
                      <span className="font-semibold text-slate-900">{entry.visit.patient.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Skipped ({entry.skipCount}x)
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient did not respond when called
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecall(entry.id)}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Recall to Waiting Queue
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* COMPLETED TAB */}
        <TabsContent value="completed" className="space-y-3">
          {queueData.completed.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              No patients marked completed yet today.
            </div>
          ) : (
            queueData.completed.map((entry) => (
              <Card key={entry.id} className="border-slate-100 bg-white opacity-80">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-500">
                      {entry.visit.tokenNumber}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {entry.visit.patient.name}
                    </span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Finished
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
