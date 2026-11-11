// apps/frontend/src/components/jobs/JobTable.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getJobs } from '../../lib/api.js';
import { useAuth } from '../../App.jsx';
import { useSSE } from '../../hooks/useSSE.js';
import StatusBadge from '../shared/StatusBadge.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table.jsx';
import { ListTodo } from 'lucide-react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function JobTable({ limit, statusFilter, typeFilter }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchJobs = async () => {
    try {
      const params = {};
      if (limit) params.limit = limit;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const data = await getJobs(params);
      setJobs(data.jobs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchJobs();
  }, [statusFilter, typeFilter]);

  useSSE(token, (event) => {
    if (['job:created', 'job:completed', 'job:failed', 'job:deleted'].includes(event.type)) {
      fetchJobs();
    }
  });

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon={ListTodo} title="No jobs" description="Jobs you create will appear here." />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Attempts</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium capitalize">{job.type.replace('_', ' ')}</TableCell>
            <TableCell><StatusBadge status={job.status} /></TableCell>
            <TableCell>{job.priority}</TableCell>
            <TableCell>{job.attempts}/{job.max_attempts}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDate(job.created_at)} {formatTime(job.created_at)}</TableCell>
            <TableCell className="text-right">
              <Link
                to={`/jobs/${job.id}`}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}