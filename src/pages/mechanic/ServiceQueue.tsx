import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input, TextArea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Edit } from 'lucide-react';

export function ServiceQueue() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState({
    status: '',
    mechanicNotes: '',
    finalCost: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('service_requests')
      .select('*, vehicle:vehicles(*), customer:profiles!service_requests_customer_id_fkey(*)')
      .eq('assigned_mechanic_id', user.id)
      .in('status', ['approved', 'in_progress', 'parts_needed', 'quality_check'])
      .order('created_at', { ascending: false });

    if (data) {
      setJobs(data);
    }
    setLoading(false);
  };

  const handleEdit = (job: any) => {
    setSelectedJob(job);
    setEditForm({
      status: job.status,
      mechanicNotes: job.mechanic_notes || '',
      finalCost: job.final_cost?.toString() || '',
    });
  };

  const handleUpdate = async () => {
    if (!selectedJob || !user) return;

    const updates: any = {
      status: editForm.status,
      mechanic_notes: editForm.mechanicNotes,
    };

    if (editForm.finalCost) {
      updates.final_cost = parseFloat(editForm.finalCost);
    }

    const { error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', selectedJob.id);

    if (!error) {
      await supabase.from('status_history').insert({
        service_request_id: selectedJob.id,
        status: editForm.status,
        notes: editForm.mechanicNotes,
        changed_by: user.id,
      });

      setSelectedJob(null);
      fetchJobs();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      parts_needed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      quality_check: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Service Queue
      </h1>

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No active jobs in queue
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
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Est. Cost
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
                        <br />
                        <span className="text-xs">{job.vehicle?.license_plate}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {job.customer?.full_name}
                        <br />
                        <span className="text-xs">{job.customer?.phone}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {job.estimated_cost ? `$${job.estimated_cost}` : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(job)}
                        >
                          <Edit className="h-4 w-4" />
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
        title="Update Service Status"
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.vehicle?.make} {selectedJob.vehicle?.model}
                </p>
              </div>
            </div>

            {selectedJob.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Customer Description</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.description}
                </p>
              </div>
            )}

            {selectedJob.admin_notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Admin Notes</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.admin_notes}
                </p>
              </div>
            )}

            <Select
              label="Status"
              options={[
                { value: 'approved', label: 'Approved (Not Started)' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'parts_needed', label: 'Parts Needed' },
                { value: 'quality_check', label: 'Quality Check' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />

            <Input
              type="number"
              label="Final Cost"
              placeholder="Enter final cost"
              value={editForm.finalCost}
              onChange={(e) => setEditForm({ ...editForm, finalCost: e.target.value })}
              step="0.01"
            />

            <TextArea
              label="Mechanic Notes"
              placeholder="Add notes about the service..."
              value={editForm.mechanicNotes}
              onChange={(e) => setEditForm({ ...editForm, mechanicNotes: e.target.value })}
              rows={4}
            />

            <div className="flex space-x-4 pt-4">
              <Button onClick={handleUpdate}>Update Status</Button>
              <Button variant="secondary" onClick={() => setSelectedJob(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
