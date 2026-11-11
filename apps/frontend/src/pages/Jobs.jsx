// apps/frontend/src/pages/Jobs.jsx
import { useState } from 'react';
import { createJob } from '../lib/api.js';
import JobTable from '../components/jobs/JobTable.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Plus, X } from 'lucide-react';

const JOB_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'image_resize', label: 'Image Resize' },
  { value: 'data_export', label: 'Data Export' },
  { value: 'webhook', label: 'Webhook' },
];

const payloadFields = {
  email: [
    { key: 'to', label: 'To', type: 'email', placeholder: 'recipient@example.com' },
    { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
    { key: 'body', label: 'Body', type: 'text', placeholder: 'Email body' },
  ],
  image_resize: [
    { key: 'width', label: 'Width', type: 'number', placeholder: '800' },
    { key: 'height', label: 'Height', type: 'number', placeholder: '600' },
    { key: 'format', label: 'Format', type: 'text', placeholder: 'webp' },
  ],
  data_export: [
    { key: 'format', label: 'Format', type: 'text', placeholder: 'csv' },
  ],
  webhook: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com/webhook' },
    { key: 'method', label: 'Method', type: 'text', placeholder: 'POST' },
  ],
};

export default function Jobs() {
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState('email');
  const [priority, setPriority] = useState(0);
  const [payload, setPayload] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const handlePayloadChange = (key, value) => {
    
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createJob({ type, payload, priority });
      setShowCreate(false);
      setPayload({});
      setPriority(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Job'}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Job</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setPayload({});
                    }}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Priority (0-9)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="9"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {payloadFields[type]?.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={payload[field.key] || ''}
                      onChange={(e) =>
                        handlePayloadChange(
                          field.key,
                          field.type === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Job'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <JobTable statusFilter={statusFilter || undefined} typeFilter={typeFilter || undefined} />
        </CardContent>
      </Card>
    </div>
  );
}