'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { HeartPulse, Activity, AlertTriangle, Flame, Check, Stethoscope } from 'lucide-react';

export function NurseStationClient({ initialVisits }: { initialVisits: any[] }) {
  const router = useRouter();
  const [visits, setVisits] = useState(initialVisits);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);

  // Vitals form
  const [bp, setBp] = useState('120/80');
  const [pulse, setPulse] = useState('72');
  const [tempC, setTempC] = useState('37.0');
  const [spo2, setSpo2] = useState('98');
  const [weightKg, setWeightKg] = useState('65');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [saving, setSaving] = useState(false);

  const openVitalsModal = (visit: any) => {
    setSelectedVisit(visit);
    if (visit.vitals?.[0]) {
      setBp(visit.vitals[0].bp || '120/80');
      setPulse(visit.vitals[0].pulse?.toString() || '72');
      setTempC(visit.vitals[0].tempC?.toString() || '37.0');
      setSpo2(visit.vitals[0].spo2?.toString() || '98');
      setWeightKg(visit.vitals[0].weightKg?.toString() || '65');
    } else {
      setBp('120/80');
      setPulse('72');
      setTempC('37.0');
      setSpo2('98');
      setWeightKg('65');
    }
    setPriority(
      ['NORMAL', 'URGENT', 'EMERGENCY'].includes(visit.priority) ? visit.priority : 'NORMAL'
    );
  };

  const handleSaveVitals = async () => {
    if (!selectedVisit) return;
    setSaving(true);
    try {
      const res = await fetch('/api/nurse/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: selectedVisit.id,
          bp,
          pulse: parseInt(pulse) || null,
          tempC: parseFloat(tempC) || null,
          spo2: parseInt(spo2) || null,
          weightKg: parseFloat(weightKg) || null,
          priority,
        }),
      });

      if (res.ok) {
        setSelectedVisit(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nurse Triage Station</h1>
          <p className="text-sm text-slate-500">
            Record patient vital signs and assess clinical priority before consultation
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 font-semibold text-xs bg-white text-slate-700">
          {visits.length} Patients in Intake
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visits.map((v) => {
          const p = v.patient;
          const hasVitals = v.vitals?.length > 0;
          const isEmergency = v.priority === 'EMERGENCY';
          const isUnassessed = v.priority === 'UNASSESSED';

          return (
            <Card
              key={v.id}
              className={`border transition hover:shadow-xs ${
                isEmergency
                  ? 'border-red-400 bg-red-50/30'
                  : isUnassessed
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-lg text-sky-700">
                    Token {v.tokenNumber}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{p.name}</h3>
                  <p className="text-xs text-slate-500">
                    Age: {p.ageYears}y • {p.gender} • UHID: {p.uhid}
                  </p>
                </div>

                <Badge
                  variant={isEmergency ? 'danger' : isUnassessed ? 'warning' : 'outline'}
                  className="text-xs uppercase"
                >
                  {v.priority}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-500">Reason:</span>{' '}
                  {v.reasonForVisit || 'General checkup'}
                </div>

                {hasVitals ? (
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-400 block">BP</span>
                      <span className="font-bold text-slate-800">{v.vitals[0].bp}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-400 block">Pulse</span>
                      <span className="font-bold text-slate-800">{v.vitals[0].pulse}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-400 block">Temp</span>
                      <span className="font-bold text-slate-800">{v.vitals[0].tempC}°C</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-400 block">SpO2</span>
                      <span className="font-bold text-slate-800">{v.vitals[0].spo2}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Awaiting vitals assessment</span>
                  </div>
                )}

                <Button
                  onClick={() => openVitalsModal(v)}
                  className="w-full h-11 text-sm font-medium gap-2"
                  variant={hasVitals ? 'outline' : 'default'}
                >
                  <HeartPulse className="h-4 w-4" />
                  {hasVitals ? 'Update Vitals & Priority' : 'Record Vitals & Priority'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Record Vitals Dialog Modal */}
      <Dialog open={!!selectedVisit} onOpenChange={(open) => !open && setSelectedVisit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Record Vitals • Token {selectedVisit?.tokenNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bp">Blood Pressure (mmHg)</Label>
                <Input
                  id="bp"
                  placeholder="120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pulse">Pulse Rate (bpm)</Label>
                <Input
                  id="pulse"
                  type="number"
                  placeholder="72"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="temp">Temp (°C)</Label>
                <Input
                  id="temp"
                  placeholder="37.0"
                  value={tempC}
                  onChange={(e) => setTempC(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="spo2">SpO2 (%)</Label>
                <Input
                  id="spo2"
                  type="number"
                  placeholder="98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  placeholder="65"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Clinical Priority Setting */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label>Triage Clinical Priority</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                    priority === 'NORMAL'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  NORMAL
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('URGENT')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                    priority === 'URGENT'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-amber-200 bg-amber-50/50 text-amber-800'
                  }`}
                >
                  URGENT
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('EMERGENCY')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                    priority === 'EMERGENCY'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-red-200 bg-red-50/50 text-red-800'
                  }`}
                >
                  EMERGENCY
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setSelectedVisit(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVitals} disabled={saving} className="h-11 px-6">
              {saving ? 'Saving...' : 'Save & Send to Doctor Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
