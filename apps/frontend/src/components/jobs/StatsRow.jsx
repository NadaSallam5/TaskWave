// apps/frontend/src/components/jobs/StatsRow.jsx
import { useEffect, useState } from 'react';
import { getJobStats } from '../../lib/api.js';
import { useAuth } from '../../App.jsx';
import { useSSE } from '../../hooks/useSSE.js';
import { Card, CardContent } from '../ui/card.jsx';
import { Briefcase, Clock, Play, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const statCards = [
  { key: 'total', label: 'Total', icon: Briefcase, color: 'text-gray-600', bg: 'bg-gray-100' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'running', label: 'Running', icon: Play, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  { key: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
];

export default function StatsRow() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  });
  const { token } = useAuth();

  const refresh = async () => {
    try {
      const data = await getJobStats();
      setStats(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useSSE(token, (event) => {
    if (['job:created', 'job:completed', 'job:failed', 'job:deleted'].includes(event.type)) {
      refresh();
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statCards.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats[key]}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}