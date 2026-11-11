// apps/frontend/src/components/workers/WorkersGrid.jsx
import { useEffect, useState } from 'react';
import { getWorkers } from '../../lib/api.js';
import { useAuth } from '../../App.jsx';
import { useSSE } from '../../hooks/useSSE.js';
import { Card, CardContent } from '../ui/card.jsx';
import StatusBadge from '../shared/StatusBadge.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import { Activity, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils.js';

function timeAgo(timestamp) {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function WorkersGrid() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const refresh = async () => {
    try {
      const data = await getWorkers();
      setWorkers(data.workers);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  useSSE(token, (event) => {
    if (['job:started', 'job:completed', 'job:failed'].includes(event.type)) {
      refresh();
    }
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <EmptyState
        icon={Cpu}
        title="No workers"
        description="No active workers found. Make sure the worker process is running."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {workers.map((worker) => (
        <Card key={worker.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Activity
                  className={cn(
                    'w-4 h-4 shrink-0',
                    worker.status === 'online' ? 'text-green-500' : 'text-gray-400'
                  )}
                />
                <span className="text-sm font-mono font-medium truncate">{worker.id}</span>
              </div>
              <StatusBadge status={worker.status === 'online' ? 'running' : 'cancelled'} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <span>Last heartbeat</span>
                <p className="text-gray-700 font-medium">{timeAgo(worker.lastHeartbeat)}</p>
              </div>
              <div>
                <span>Jobs processed</span>
                <p className="text-gray-700 font-medium">{worker.jobsProcessed}</p>
              </div>
              <div className="col-span-2">
                <span>Current job</span>
                <p className="text-gray-700 font-mono truncate">{worker.currentJob || 'Idle'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}