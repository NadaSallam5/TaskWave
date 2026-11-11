// apps/frontend/src/components/shared/StatusBadge.jsx
import { Badge } from '../ui/badge.jsx';

const statusMap = {
  pending: { label: 'Pending', variant: 'warning' },
  running: { label: 'Running', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

export default function StatusBadge({ status }) {
  const config = statusMap[status] || { label: status, variant: 'secondary' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}