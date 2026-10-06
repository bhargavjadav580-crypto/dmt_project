'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { searchPatients } from '@/features/patients/actions';
import {
  Search,
  UserPlus,
  User,
  ArrowRight,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export function PatientDirectoryClient({ initialPatients }: { initialPatients: any[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<any[]>(initialPatients);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setPatients(initialPatients);
      return;
    }
    setLoading(true);
    try {
      const res = await searchPatients(query);
      if (res.ok) {
        setPatients(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Register Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-500">
            Search patient records by name, phone, UHID, or visit token
          </p>
        </div>

        <Button asChild size="lg" className="h-12 px-6 gap-2">
          <Link href="/patients/new">
            <UserPlus className="h-5 w-5" />
            Register Patient
          </Link>
        </Button>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by patient name, phone number, UHID (e.g. P00001), or token..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 text-base rounded-xl"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 shrink-0" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {/* Results List */}
      <div className="space-y-3">
        {patients.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 text-base">No patients found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any patient matching "{query}". Try checking the spelling or phone number.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/patients/new">Register as New Patient</Link>
            </Button>
          </div>
        ) : (
          patients.map((p) => {
            const activeVisit = p.visits?.[0];
            const allergies = p.allergies ? JSON.parse(p.allergies) : [];

            return (
              <Card
                key={p.id}
                className="hover:border-sky-300 hover:shadow-sm transition cursor-pointer"
                onClick={() => router.push(`/patients/${p.id}`)}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {p.uhid}
                      </Badge>
                      {allergies.length > 0 && (
                        <Badge variant="danger" className="text-xs">
                          Allergies: {allergies.join(', ')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>Age: {p.ageYears}y</span>
                      <span>Gender: {p.gender}</span>
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {p.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Visit Tag & Open Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    {activeVisit ? (
                      <div className="text-right">
                        <Badge className="bg-sky-100 text-sky-800 border-sky-200">
                          Active: Token {activeVisit.tokenNumber}
                        </Badge>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {activeVisit.department?.name} • {activeVisit.stage}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No active visit</span>
                    )}

                    <Button variant="ghost" size="sm" className="gap-1 text-sky-600 hover:text-sky-700">
                      Open <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
