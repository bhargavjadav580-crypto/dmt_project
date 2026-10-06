'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert, Lock, ArrowRight, UserCheck } from 'lucide-react';

const DEMO_USERS = [
  { role: 'RECEPTIONIST', email: 'reception@hospital.flow', name: 'Priya Sharma (Receptionist)' },
  { role: 'NURSE', email: 'nurse@hospital.flow', name: 'Anjali Verma (Nurse)' },
  { role: 'DOCTOR', email: 'doctor1@hospital.flow', name: 'Dr. Amit Patel (General OPD)' },
  { role: 'LAB_TECH', email: 'lab@hospital.flow', name: 'Ravi Desai (Lab Tech)' },
  { role: 'PHARMACIST', email: 'pharma@hospital.flow', name: 'Meena Iyer (Pharmacist)' },
  { role: 'ADMISSION_STAFF', email: 'admission@hospital.flow', name: 'Suresh Nair (Admissions)' },
  { role: 'BILLING_STAFF', email: 'billing@hospital.flow', name: 'Kavita Joshi (Billing)' },
  { role: 'ADMIN', email: 'admin@hospital.flow', name: 'Dr. Rajesh Kumar (Admin)' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Incorrect email or password. Please try again.');
        setLoading(false);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong during sign in. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    // Standard seeded demo password pattern
    const rolePasswords: Record<string, string> = {
      'reception@hospital.flow': 'reception123',
      'nurse@hospital.flow': 'nurse123',
      'doctor1@hospital.flow': 'doctor123',
      'lab@hospital.flow': 'lab123',
      'pharma@hospital.flow': 'pharma123',
      'admission@hospital.flow': 'admission123',
      'billing@hospital.flow': 'billing123',
      'admin@hospital.flow': 'admin123',
    };
    const demoPwd = rolePasswords[demoEmail] || 'password123';
    setPassword(demoPwd);
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email: demoEmail,
        password: demoPwd,
        redirect: false,
      });

      if (res?.error) {
        setError('Demo login failed. Make sure database is seeded.');
        setLoading(false);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err?.message || 'Error logging in.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-sky-50 to-slate-100 p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md">
          <Activity className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Flow</h1>
          <p className="text-sm text-slate-500">Patient Journey & Flow Management</p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Sign in to your station</CardTitle>
          <CardDescription>
            Enter your hospital staff credentials to access your workflow queue
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@hospital.flow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Demo Logins Panel (visible in development) */}
      <div className="w-full max-w-md mt-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-sky-600" />
            1-Click Demo Logins
          </span>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Dev Mode
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_USERS.map((user) => (
            <button
              key={user.role}
              type="button"
              onClick={() => handleDemoLogin(user.email)}
              disabled={loading}
              className="text-left p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 transition text-xs flex flex-col gap-0.5 disabled:opacity-50"
            >
              <span className="font-semibold text-slate-800">{user.role}</span>
              <span className="text-slate-500 truncate">{user.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
