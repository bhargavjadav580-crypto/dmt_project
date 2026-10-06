'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Maximize2, Clock, Activity, Building2 } from 'lucide-react';

interface DisplayData {
  department: {
    id: string;
    name: string;
    code: string;
    tokenPrefix: string;
  };
  nowServing: {
    tokenNumber: string;
    status: string;
    calledAt: string;
    counter: string;
  } | null;
  nextTokens: Array<{
    tokenNumber: string;
    priority: string;
  }>;
  timestamp: string;
}

export function DisplayClient({ 
  deptCode, 
  initialData 
}: { 
  deptCode: string; 
  initialData: DisplayData | null;
}) {
  const [data, setData] = useState<DisplayData | null>(initialData);
  const [lastToken, setLastToken] = useState<string | null>(initialData?.nowServing?.tokenNumber || null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/display/${deptCode}`);
        if (!res.ok) return;
        const json: DisplayData = await res.json();
        if (!mounted) return;

        // Check if token changed
        if (json.nowServing?.tokenNumber && json.nowServing.tokenNumber !== lastToken) {
          setLastToken(json.nowServing.tokenNumber);
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 2500);

          if (soundEnabled) {
            playChime();
          }
        }

        setData(json);
      } catch (err) {
        console.error('Display poll error:', err);
      }
    };

    const interval = setInterval(fetchData, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deptCode, lastToken, soundEnabled]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio autoplay policy
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const departmentName = data?.department.name || deptCode.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-2xl shadow-lg shadow-primary-500/20">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
              {departmentName}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base font-medium flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Patient Token Display • No Private Health Info
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-slate-200">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400 font-medium">HOSPITAL TIME (IST)</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5 text-emerald-400" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="my-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* NOW SERVING - Giant 2-col card */}
        <div 
          className={`lg:col-span-2 rounded-3xl p-8 sm:p-14 flex flex-col justify-center items-center text-center transition-all duration-500 border ${
            isFlashing 
              ? 'bg-primary-900/60 border-primary-400 ring-8 ring-primary-500/30 scale-[1.01]' 
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <span className="px-5 py-2 rounded-full bg-primary-600/30 border border-primary-500/40 text-primary-300 font-bold tracking-widest text-sm uppercase mb-4">
            NOW SERVING / अब सेवा में
          </span>

          {data?.nowServing ? (
            <div className="space-y-4">
              <div className="text-7xl sm:text-9xl md:text-[11rem] font-black tracking-tighter text-white font-mono leading-none drop-shadow-xl">
                {data.nowServing.tokenNumber}
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-slate-300 flex items-center justify-center gap-3">
                <span className="text-slate-400">Please proceed to:</span>
                <span className="px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {data.nowServing.counter}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 space-y-3">
              <Clock className="h-16 w-16 text-slate-600 mx-auto animate-pulse" />
              <div className="text-3xl sm:text-4xl font-bold text-slate-400">
                WAITING FOR NEXT CALL
              </div>
              <p className="text-slate-500 text-base">Please be seated in the waiting lobby.</p>
            </div>
          )}
        </div>

        {/* NEXT IN LINE - 1-col card */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                Next In Line / अगले टोकन
              </h2>
              <span className="text-xs text-slate-400">Priority order</span>
            </div>

            <div className="mt-6 space-y-3">
              {data?.nextTokens && data.nextTokens.length > 0 ? (
                data.nextTokens.map((item, idx) => (
                  <div
                    key={item.tokenNumber}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-2xl font-black font-mono tracking-tight text-slate-100">
                        {item.tokenNumber}
                      </span>
                    </div>

                    {item.priority === 'EMERGENCY' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                        EMERGENCY
                      </span>
                    ) : item.priority === 'URGENT' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                        URGENT
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Ready</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No upcoming tokens in queue.
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">
              Tokens called automatically in priority order. For assistance, speak to reception desk.
            </p>
          </div>
        </div>
      </main>

      {/* Ticker / Footer */}
      <footer className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Hospital Flow System • Live Queue Display</span>
        </div>
        <div className="font-mono text-slate-400">
          Auto-refresh every 4s • Press F11 for full screen
        </div>
      </footer>
    </div>
  );
}
