'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBoxProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  shortcut?: string;
  loading?: boolean;
  className?: string;
}

export function SearchBox({ placeholder, value, onChange, shortcut, loading, className }: SearchBoxProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value if it changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!shortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcut.toLowerCase()) {
        e.preventDefault();
        const el = document.getElementById('search-input-box');
        if (el) el.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>
      
      <Input
        id="search-input-box"
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 pr-12 w-full"
      />
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : shortcut ? (
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>{shortcut.toUpperCase()}
          </kbd>
        ) : null}
      </div>
    </div>
  );
}
