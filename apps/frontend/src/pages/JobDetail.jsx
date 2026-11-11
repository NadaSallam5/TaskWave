// apps/frontend/src/pages/JobDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { getJob, deleteJob } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useSSE } from '../hooks/useSSE.js';
import JobInspector from '../components/jobs/JobInspector.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import { ArrowLeft, FileText } from 'lucide-react';
import { cn } from '../lib/utils.js';

const logColors = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  warn: 'text-amber-600 bg-amber-50 border-amber-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  debug: 'text-gray-600 bg-gray-50 border-gray-200',
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchJob = async () => {
    try {
      const data = await getJob(id);
      setJob(data.job);
      setLogs(data.logs);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  useSSE(token, (event) => {
    if (event.job?.id === id) {
      fetchJob();
    }
  });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await deleteJob(id);
      navigate('/jobs', { replace: true });
    } catch {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        description="The job you are looking for does not exist or you don't have access."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <JobInspector
            job={job}
            onCancel={job.status === 'pending' ? handleCancel : null}
          />
          {cancelling && <p className="text-sm text-gray-500 mt-2">Cancelling...</p>}
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <EmptyState
                  title="No logs"
                  description="Logs will appear once the job starts processing."
                />
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border text-sm',
                        logColors[log.level] || logColors.debug
                      )}
                    >
                      <span className="text-xs font-mono whitespace-nowrap mt-0.5 opacity-70">
                        {formatTime(log.created_at)}
                      </span>
                      <span className="uppercase text-xs font-bold mt-0.5 opacity-60 w-12 shrink-0">
                        {log.level}
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}