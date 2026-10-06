'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Activity,
  UserPlus,
  Users,
  Clock,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Pill,
  BedDouble,
  CreditCard,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  FileCheck,
  ShieldAlert,
  Sliders,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ConnectionBanner } from '@/components/shared/connection-banner';
import { DemoBanner } from '@/components/shared/demo-banner';

interface AppShellClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
    language: string;
  };
  departments: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    tokenPrefix: string;
  }>;
  children: React.ReactNode;
}

export function AppShellClient({ user, departments, children }: AppShellClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentLang, setCurrentLang] = useState(user.language || 'en');

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search inside dialog
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Role-based navigation modules
  const getNavLinks = () => {
    const links: Array<{ label: string; href: string; icon: any; roles?: string[] }> = [
      { label: 'Home', href: '/dashboard', icon: Activity },
    ];

    if (['RECEPTIONIST', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Register Patient', href: '/patients/new', icon: UserPlus });
    }

    links.push({ label: 'Find Patient', href: '/patients', icon: Users });

    if (['RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Department Queue', href: '/queue', icon: Clock });
    }

    if (['NURSE', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Nurse Station', href: '/nurse', icon: HeartPulse });
    }

    if (['DOCTOR', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Consultations', href: '/consultation', icon: Stethoscope });
    }

    if (['LAB_TECH', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Laboratory', href: '/lab', icon: FlaskConical });
    }

    if (['PHARMACIST', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Pharmacy', href: '/pharmacy', icon: Pill });
    }

    if (['ADMISSION_STAFF', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Admissions & Beds', href: '/admissions', icon: BedDouble });
      links.push({ label: 'Discharges', href: '/discharge', icon: FileCheck });
    }

    if (['BILLING_STAFF', 'ADMIN'].includes(user.role)) {
      links.push({ label: 'Billing', href: '/billing', icon: CreditCard });
    }

    if (user.role === 'ADMIN') {
      links.push({ label: 'Command Center', href: '/admin', icon: Sliders });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100/90 via-sky-50/40 to-slate-100/80 text-slate-900 relative">
      <ConnectionBanner />
      <DemoBanner />

      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-xs">
                <Activity className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-slate-900 hidden sm:inline tracking-tight">
                Hospital Flow
              </span>
            </Link>
          </div>

          {/* Middle: Global Search bar trigger */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200/60 transition"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                Search patient, token, UHID...
              </span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Now serving, language, notifications, user profile */}
          <div className="flex items-center gap-3">
            {/* Now Serving Live Chip */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              <span>General OPD: A-012</span>
            </div>

            {/* Language Switcher */}
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              className="text-xs bg-slate-100 border border-slate-200 text-slate-700 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-200/60 transition"
              aria-label="Language selection"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="gu">ગુજરાતી</option>
            </select>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Link>

            {/* User profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 uppercase tracking-wide">
                  {user.role}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Sign out"
                className="text-slate-600 hover:text-red-600 p-2 h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80 hidden md:flex flex-col shrink-0 shadow-xs">
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/patients'
                  ? pathname === '/patients' || (pathname.startsWith('/patients/') && pathname !== '/patients/new')
                  : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/15 via-sky-500/10 to-transparent text-sky-800 font-bold border-l-4 border-sky-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick link to public waiting room display */}
          <div className="p-3 border-t border-slate-100">
            <Link
              href="/display/GENERAL_OPD"
              target="_blank"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 transition"
            >
              <span>Waiting Room TV Board</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </aside>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 z-30 bg-white border-b border-slate-200 shadow-xl p-4 space-y-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5 text-sky-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Search Dialog Modal (Ctrl+K) */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-white shadow-2xl border border-slate-200 rounded-2xl">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
            <Search className="h-5 w-5 text-sky-600 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search by patient name, phone, UHID (e.g. P00001), or token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none pr-8"
            />
            {searching && <span className="text-xs text-sky-600 font-semibold animate-pulse shrink-0">Searching...</span>}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 bg-white">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                <Search className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                <p className="font-medium text-slate-700">
                  {searchQuery.trim()
                    ? 'No matching patient records found.'
                    : 'Type a name, phone number, or UHID to search'}
                </p>
                <span className="text-xs text-slate-400">Try searching "Rajesh", "P00001", or "9876543210"</span>
              </div>
            ) : (
              searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(`/patients/${p.id}`);
                  }}
                  className="p-3.5 hover:bg-sky-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      UHID: <span className="font-semibold text-slate-700">{p.uhid}</span> • Age: {p.ageYears}y • {p.gender}
                      {p.phone ? ` • Phone: ${p.phone}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
