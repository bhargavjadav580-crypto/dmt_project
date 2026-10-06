'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/utils';
import { updateUserRole, updateSetting } from '@/features/admin/actions';
import { 
  Activity, Users, Clock, AlertTriangle, ShieldCheck, 
  Settings, Building2, TrendingDown, TrendingUp, CheckCircle2, BedDouble, Stethoscope
} from 'lucide-react';

interface AdminClientProps {
  overview: {
    patientsToday: number;
    waiting: number;
    inConsultation: number;
    emergency: number;
    admitted: number;
    bedsAvailable: number;
    readyForDischarge: number;
  };
  departments: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    tokenPrefix: string;
    patientCount: number;
    avgWaitMinutes: number;
    status: string;
  }>;
  bottlenecks: {
    registrationToConsultation: number;
    consultationToLab: number;
    labTurnaround: number;
    pharmacyWait: number;
    yesterdayComparison: {
      registrationToConsultation: number;
      labTurnaround: number;
      pharmacyWait: number;
    };
  };
  auditLogs: Array<{
    id: string;
    actorName: string;
    action: string;
    entityType: string;
    entityId: string;
    reason?: string | null;
    createdAt: Date | string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department?: { name: string } | null;
  }>;
  settings: Array<{
    key: string;
    value: string;
  }>;
}

export function AdminClient({
  overview,
  departments,
  bottlenecks,
  auditLogs,
  users: initialUsers,
  settings: initialSettings,
}: AdminClientProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [settings, setSettings] = useState(initialSettings);
  const [settingValues, setSettingValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialSettings.forEach(s => {
      try {
        const parsed = JSON.parse(s.value);
        map[s.key] = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
      } catch {
        map[s.key] = s.value;
      }
    });
    return map;
  });
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState('');

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUser(userId);
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast({ title: 'Role Updated', description: 'User role updated successfully.', variant: 'success' });
      } else {
        toast({ title: 'Update Failed', description: res.error.messageKey, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update user role.', variant: 'error' });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleSettingSave = async (key: string) => {
    const val = settingValues[key];
    try {
      let payload: any = val;
      if (!isNaN(Number(val))) {
        payload = Number(val);
      }
      const res = await updateSetting(key, payload);
      if (res.ok) {
        toast({ title: 'Setting Saved', description: `Updated ${key} successfully.`, variant: 'success' });
      } else {
        toast({ title: 'Save Failed', description: res.error.messageKey, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save setting.', variant: 'error' });
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!auditFilter) return true;
    const q = auditFilter.toLowerCase();
    return (
      log.actorName?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.entityType?.toLowerCase().includes(q) ||
      log.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            Hospital Command Center
          </h1>
          <p className="text-sm text-neutral-500">
            Real-time operations, throughput analytics, audit governance, and hospital settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1.5 px-3">
            <CheckCircle2 className="h-4 w-4 mr-1 inline" /> System Operational
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="operations" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-xl h-12 bg-neutral-100 p-1">
          <TabsTrigger value="operations" className="h-10 text-sm font-medium">Operations</TabsTrigger>
          <TabsTrigger value="bottlenecks" className="h-10 text-sm font-medium">Bottlenecks</TabsTrigger>
          <TabsTrigger value="audit" className="h-10 text-sm font-medium">Audit Log</TabsTrigger>
          <TabsTrigger value="settings" className="h-10 text-sm font-medium">Staff & Settings</TabsTrigger>
        </TabsList>

        {/* TAB 1: OPERATIONS */}
        <TabsContent value="operations" className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="bg-white border-neutral-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-neutral-500">Patients Today</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{overview.patientsToday}</p>
                <span className="text-[11px] text-neutral-400">Total Visits</span>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-amber-700">Waiting in Queue</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{overview.waiting}</p>
                <span className="text-[11px] text-amber-600">Pending consultation</span>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-blue-700">In Consultation</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{overview.inConsultation}</p>
                <span className="text-[11px] text-blue-600">Active sessions</span>
              </CardContent>
            </Card>
            <Card className={`border ${overview.emergency > 0 ? 'bg-red-50/70 border-red-300' : 'bg-white border-neutral-200'}`}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-red-700">Emergency Active</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{overview.emergency}</p>
                <span className="text-[11px] text-red-600">Priority triage</span>
              </CardContent>
            </Card>
            <Card className="bg-purple-50/50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-purple-700">Admitted</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{overview.admitted}</p>
                <span className="text-[11px] text-purple-600">Inpatient wards</span>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-emerald-700">Beds Available</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{overview.bedsAvailable}</p>
                <span className="text-[11px] text-emerald-600">Ready for assign</span>
              </CardContent>
            </Card>
            <Card className="bg-teal-50/50 border-teal-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-teal-700">Ready Discharge</p>
                <p className="text-2xl font-bold text-teal-900 mt-1">{overview.readyForDischarge}</p>
                <span className="text-[11px] text-teal-600">Pending checkout</span>
              </CardContent>
            </Card>
          </div>

          {/* Department live status grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Department Patient Flow & Capacity</CardTitle>
              <CardDescription>Live queues, token prefixes, and workload pressure across active departments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {departments.map((dept) => {
                  const isHigh = dept.status === 'High Load';
                  const isBusy = dept.status === 'Busy';
                  return (
                    <div 
                      key={dept.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        isHigh 
                          ? 'border-red-300 bg-red-50/40' 
                          : isBusy 
                            ? 'border-amber-300 bg-amber-50/30' 
                            : 'border-neutral-200 bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-neutral-900">{dept.name}</span>
                        <Badge 
                          variant="outline"
                          className={
                            isHigh 
                              ? 'bg-red-100 text-red-700 border-red-200' 
                              : isBusy 
                                ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }
                        >
                          {dept.status}
                        </Badge>
                      </div>
                      <div className="flex items-baseline justify-between mt-3 text-sm">
                        <span className="text-neutral-500">Token Prefix:</span>
                        <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border text-xs">{dept.tokenPrefix}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1 text-sm">
                        <span className="text-neutral-500">Active Patients:</span>
                        <span className="font-bold text-neutral-900 text-base">{dept.patientCount}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1 text-sm">
                        <span className="text-neutral-500">Est. Average Wait:</span>
                        <span className="font-medium text-neutral-700">{dept.avgWaitMinutes} mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: BOTTLENECKS */}
        <TabsContent value="bottlenecks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Average Flow Stage Duration
                </CardTitle>
                <CardDescription>Average turnaround time between patient journey transitions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-neutral-700">Registration to Doctor Consultation</span>
                    <span className="font-bold text-neutral-900">{bottlenecks.registrationToConsultation} mins</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary-600 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, bottlenecks.registrationToConsultation * 2.5)}%` }} 
                    />
                  </div>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> {Math.abs(bottlenecks.yesterdayComparison.registrationToConsultation)} mins faster than yesterday
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-neutral-700">Consultation to Lab Order Dispatch</span>
                    <span className="font-bold text-neutral-900">{bottlenecks.consultationToLab} mins</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, bottlenecks.consultationToLab * 4)}%` }} 
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Within standard 15-minute guideline</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-neutral-700">Lab Sample to Result Finalization</span>
                    <span className="font-bold text-neutral-900">{bottlenecks.labTurnaround} mins</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, bottlenecks.labTurnaround * 2)}%` }} 
                    />
                  </div>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> {Math.abs(bottlenecks.yesterdayComparison.labTurnaround)} mins improved turnaround
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-neutral-700">Pharmacy Queue to Dispense</span>
                    <span className="font-bold text-neutral-900">{bottlenecks.pharmacyWait} mins</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, bottlenecks.pharmacyWait * 5)}%` }} 
                    />
                  </div>
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {bottlenecks.yesterdayComparison.pharmacyWait} min slower due to batching
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-600" />
                  Throughput Recommendations
                </CardTitle>
                <CardDescription>Automated operational insights to prevent patient stagnation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 text-sm">General OPD Peak Wait Warning</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Average wait time in General OPD is nearing 25 minutes. Consider assigning a floating doctor or opening Counter 2.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-emerald-900 text-sm">Bed Turnover Optimal</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Cleaning and maintenance turnarounds are currently under 20 minutes across General and ICU wards.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/60 flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm">Doctor Review Queue Alert</h4>
                    <p className="text-xs text-blue-800 mt-0.5">
                      Patients with completed lab reports have their review flag set immediately to ensure seamless post-investigation consultations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: AUDIT LOG */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary-600" />
                  System Audit Trail & Compliance
                </CardTitle>
                <CardDescription>Immutable log of clinical transitions, user updates, and data views.</CardDescription>
              </div>
              <div className="w-64">
                <Input
                  placeholder="Filter audit logs..."
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs font-semibold text-neutral-500 uppercase">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-400">
                          No audit entries match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-50">
                          <td className="py-2.5 px-3 font-mono text-neutral-600 whitespace-nowrap">
                            {formatDateTime(new Date(log.createdAt))}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-neutral-900">
                            {log.actorName}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge 
                              variant="outline" 
                              className={
                                log.action === 'CREATE' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : log.action === 'UPDATE' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : log.action === 'BREAK_GLASS' 
                                      ? 'bg-red-50 text-red-700 border-red-200 font-bold' 
                                      : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                              }
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-700">
                            {log.entityType} ({log.entityId.slice(0, 10)})
                          </td>
                          <td className="py-2.5 px-3 text-neutral-600">
                            {log.reason || 'Standard operational flow update'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: USERS & SETTINGS */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User roles management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  Staff Role Assignments
                </CardTitle>
                <CardDescription>Manage user roles and department associations.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border bg-neutral-50/50">
                      <div>
                        <p className="font-semibold text-sm text-neutral-900">{u.name}</p>
                        <p className="text-xs text-neutral-500">{u.email} • {u.department?.name || 'All Hospital'}</p>
                      </div>
                      <div className="w-40">
                        <Select
                          value={u.role}
                          disabled={updatingUser === u.id}
                          onValueChange={(val) => handleRoleChange(u.id, val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="RECEPTIONIST">RECEPTIONIST</SelectItem>
                            <SelectItem value="NURSE">NURSE</SelectItem>
                            <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                            <SelectItem value="LAB_TECH">LAB_TECH</SelectItem>
                            <SelectItem value="PHARMACIST">PHARMACIST</SelectItem>
                            <SelectItem value="ADMISSION_STAFF">ADMISSION_STAFF</SelectItem>
                            <SelectItem value="BILLING_STAFF">BILLING_STAFF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Threshold & system settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary-600" />
                  Hospital Operational Thresholds
                </CardTitle>
                <CardDescription>Configure queue alert limits, fees, and idle timeouts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(settingValues).map((key) => (
                  <div key={key} className="p-3 rounded-lg border bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => handleSettingSave(key)}
                      >
                        Save
                      </Button>
                    </div>
                    <Input
                      value={settingValues[key]}
                      onChange={(e) => setSettingValues(prev => ({ ...prev, [key]: e.target.value }))}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
