import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Wrench, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { api } from '../../lib/api';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalMechanics: 0,
    totalCustomers: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const [requests, mechanics, customers] = await Promise.all([
      api.listServiceRequests({ include: 'customer,vehicle', order: 'created_at.desc' }),
      api.listProfiles({ role: 'mechanic', order: 'full_name.asc' }),
      api.listProfiles({ role: 'customer', order: 'full_name.asc' }),
    ]);

    if (requests) {
      setStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        inProgressRequests: requests.filter(r => ['approved', 'in_progress', 'parts_needed', 'quality_check'].includes(r.status)).length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        totalMechanics: mechanics?.length || 0,
        totalCustomers: customers?.length || 0,
      });
      setRecentRequests(requests.slice(0, 5));
    }

    setLoading(false);
  };

  const statCards = [
    { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'yellow' },
    { label: 'In Progress', value: stats.inProgressRequests, icon: FileText, color: 'blue' },
    { label: 'Completed', value: stats.completedRequests, icon: CheckCircle, color: 'green' },
    { label: 'Total Requests', value: stats.totalRequests, icon: AlertCircle, color: 'gray' },
    { label: 'Mechanics', value: stats.totalMechanics, icon: Wrench, color: 'blue' },
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`h-12 w-12 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Service Requests
            </h3>
            <Link
              to="/admin/service-requests"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View All
            </Link>
          </div>
        </div>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
          ) : recentRequests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {request.customer?.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {request.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.vehicle?.make} {request.vehicle?.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
