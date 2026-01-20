import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Car, Clock, CheckCircle, Plus } from 'lucide-react';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ServiceRequest } from '../../lib/database.types';

export function CustomerDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    const data = await api.listServiceRequests({
      customer_id: user.id,
      order: 'created_at.desc',
      limit: 5,
    });

    setRequests(data);
    setLoading(false);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => ['approved', 'in_progress', 'parts_needed', 'quality_check'].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <Link to="/customer/new-request">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            New Service Request
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {pendingCount}
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {inProgressCount}
                </p>
              </div>
              <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {completedCount}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Service Requests</CardTitle>
            <Link to="/customer/my-requests">
              <Button variant="secondary" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Loading...
            </p>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No service requests yet
              </p>
              <Link to="/customer/new-request">
                <Button>Create Your First Request</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {request.service_type}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                      ${request.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                      ${request.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                      ${request.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      ${request.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                    `}
                  >
                    {request.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
