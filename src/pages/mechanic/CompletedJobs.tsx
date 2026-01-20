import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Eye } from 'lucide-react';

export function CompletedJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('service_requests')
      .select('*, vehicle:vehicles(*), customer:profiles!service_requests_customer_id_fkey(*)')
      .eq('assigned_mechanic_id', user.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false });

    if (data) {
      setJobs(data);
    }
    setLoading(false);
  };

  const handleView = (job: any) => {
    setSelectedJob(job);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Completed Jobs
      </h1>

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No completed jobs yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Service Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Final Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Completed Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {job.service_type}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {job.vehicle?.make} {job.vehicle?.model}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {job.customer?.full_name}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                        {job.final_cost ? `$${job.final_cost}` : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(job.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleView(job)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title="Job Details"
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Service Type</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.service_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  COMPLETED
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.vehicle?.make} {selectedJob.vehicle?.model} ({selectedJob.vehicle?.license_plate})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.customer?.full_name}
                </p>
              </div>
            </div>

            {selectedJob.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Initial Description</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.description}
                </p>
              </div>
            )}

            {selectedJob.mechanic_notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Work Notes</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.mechanic_notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedJob.estimated_cost && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Cost</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ${selectedJob.estimated_cost}
                  </p>
                </div>
              )}
              {selectedJob.final_cost && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Final Cost</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${selectedJob.final_cost}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(selectedJob.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
