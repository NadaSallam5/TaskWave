// apps/frontend/src/components/jobs/JobInspector.jsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import StatusBadge from '../shared/StatusBadge.jsx';
import { Button } from '../ui/button.jsx';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

function safeJsonParse(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export default function JobInspector({ job, onCancel }) {
  if (!job) return null;

  const payload = safeJsonParse(job.payload);
  const result = safeJsonParse(job.result);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Job Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">ID</span>
            <p className="font-mono text-xs mt-0.5 break-all">{job.id}</p>
          </div>
          <div>
            <span className="text-gray-500">Type</span>
            <p className="font-medium mt-0.5 capitalize">{job.type.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <div className="mt-1"><StatusBadge status={job.status} /></div>
          </div>
          <div>
            <span className="text-gray-500">Priority</span>
            <p className="font-medium mt-0.5">{job.priority}</p>
          </div>
          <div>
            <span className="text-gray-500">Attempts</span>
            <p className="font-medium mt-0.5">{job.attempts} / {job.max_attempts}</p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p className="mt-0.5">{formatDateTime(job.created_at)}</p>
          </div>
          <div>
            <span className="text-gray-500">Started</span>
            <p className="mt-0.5">{formatDateTime(job.started_at)}</p>
          </div>
          <div>
            <span className="text-gray-500">Completed</span>
            <p className="mt-0.5">{formatDateTime(job.completed_at)}</p>
          </div>
        </div>

        {payload && Object.keys(payload).length > 0 && (
          <div>
            <span className="text-gray-500 text-sm">Payload</span>
            <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}

        {result && (
          <div>
            <span className="text-gray-500 text-sm">Result</span>
            <pre className="mt-1 p-3 bg-green-50 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {job.error && (
          <div>
            <span className="text-gray-500 text-sm">Error</span>
            <pre className="mt-1 p-3 bg-red-50 rounded-lg text-xs text-red-700 overflow-auto max-h-40">
              {job.error}
            </pre>
          </div>
        )}

        {job.status === 'pending' && onCancel && (
          <Button variant="destructive" size="sm" onClick={() => onCancel(job.id)}>
            Cancel Job
          </Button>
        )}
      </CardContent>
    </Card>
  );
}