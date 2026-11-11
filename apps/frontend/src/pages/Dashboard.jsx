// apps/frontend/src/pages/Dashboard.jsx
import StatsRow from '../components/jobs/StatsRow.jsx';
import JobTable from '../components/jobs/JobTable.jsx';
import WorkersGrid from '../components/workers/WorkersGrid.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <StatsRow />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <JobTable limit={5} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workers</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkersGrid />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}