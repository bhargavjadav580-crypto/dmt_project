'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/utils';
import { markNotificationRead } from '@/features/notifications/actions';
import { 
  Bell, Check, ExternalLink, AlertCircle, FlaskConical, Pill, BedDouble, 
  ArrowRight, ShieldAlert, CheckCheck
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  link?: string | null;
  readAt?: Date | string | null;
  createdAt: Date | string;
}

interface NotificationsClientProps {
  notifications: NotificationItem[];
}

export function NotificationsClient({ notifications: initialNotifications }: NotificationsClientProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const handleMarkRead = async (id: string) => {
    try {
      const res = await markNotificationRead(id);
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
        toast({ title: 'Marked as read', variant: 'success' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not mark notification as read.', variant: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.readAt);
    for (const item of unread) {
      await markNotificationRead(item.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
    toast({ title: 'All notifications cleared', variant: 'success' });
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.readAt;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LAB_RESULT':
        return <FlaskConical className="h-5 w-5 text-purple-600" />;
      case 'PRESCRIPTION':
        return <Pill className="h-5 w-5 text-emerald-600" />;
      case 'ADMISSION':
        return <BedDouble className="h-5 w-5 text-blue-600" />;
      case 'EMERGENCY':
        return <ShieldAlert className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary-600" />
            Notifications & Alerts
          </h1>
          <p className="text-sm text-neutral-500">
            Real-time handoffs, lab result alerts, and priority workflow notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="h-9 text-xs">
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
          className="h-8 text-xs font-medium"
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className="h-8 text-xs font-medium"
        >
          All Notifications ({notifications.length})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center bg-neutral-50/50 border-dashed">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-70" />
            <h3 className="font-semibold text-neutral-800 text-sm">You are all caught up!</h3>
            <p className="text-xs text-neutral-500 mt-1">No unread notifications or workflow alerts.</p>
          </Card>
        ) : (
          filtered.map((item) => {
            const isUnread = !item.readAt;
            return (
              <Card 
                key={item.id} 
                className={`transition-all border ${
                  isUnread 
                    ? 'border-primary-200 bg-primary-50/20 shadow-sm' 
                    : 'border-neutral-200 bg-white opacity-85'
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3.5">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    item.priority === 'URGENT' ? 'bg-red-100' : 'bg-neutral-100'
                  }`}>
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-neutral-900 text-sm">{item.title}</span>
                      {item.priority === 'URGENT' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] py-0">
                          Urgent
                        </Badge>
                      )}
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{item.message}</p>
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      {formatDateTime(new Date(item.createdAt))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {item.link && (
                      <Link href={item.link}>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          Open <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    )}
                    {isUnread && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                        onClick={() => handleMarkRead(item.id)}
                        title="Mark read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
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

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
