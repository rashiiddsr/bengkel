import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ServiceRequest, Vehicle, StatusHistory, Profile } from '../../lib/database.types';
import { Eye, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface RequestWithDetails extends ServiceRequest {
  vehicle?: Vehicle;
  mechanic?: Profile;
  history?: StatusHistory[];
}

export function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    const data = await api.listServiceRequests({
      customer_id: user.id,
      include: 'vehicle,mechanic',
      order: 'created_at.desc',
    });

    setRequests(data as RequestWithDetails[]);
    setLoading(false);
  };

  const fetchHistory = async (requestId: string) => {
    return api.listStatusHistory({
      service_request_id: requestId,
      include: 'changed_by_profile',
      order: 'created_at.desc',
    });
  };

  const handleViewDetails = async (request: RequestWithDetails) => {
    const history = await fetchHistory(request.id);
    setSelectedRequest({ ...request, history });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      parts_needed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      quality_check: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        My Service Requests
      </h1>

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Loading...
            </p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No service requests found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {request.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.vehicle?.make} {request.vehicle?.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewDetails(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
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
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Service Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Service Type</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.service_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.vehicle?.make} {selectedRequest.vehicle?.model} ({selectedRequest.vehicle?.license_plate})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Mechanic</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.mechanic?.full_name || 'Not assigned yet'}
                </p>
              </div>
            </div>

            {selectedRequest.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.description}
                </p>
              </div>
            )}

            {selectedRequest.estimated_cost && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Cost</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${selectedRequest.estimated_cost}
                </p>
              </div>
            )}

            {selectedRequest.final_cost && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Final Cost</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${selectedRequest.final_cost}
                </p>
              </div>
            )}

            {selectedRequest.mechanic_notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mechanic Notes</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.mechanic_notes}
                </p>
              </div>
            )}

            {selectedRequest.history && selectedRequest.history.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status History</p>
                <div className="space-y-2">
                  {selectedRequest.history.map((entry: any) => (
                    <div key={entry.id} className="flex items-start space-x-3 text-sm">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          Status changed to <span className="font-medium">{entry.status}</span>
                        </p>
                        {entry.notes && (
                          <p className="text-gray-600 dark:text-gray-400">{entry.notes}</p>
                        )}
                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
