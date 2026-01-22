import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Wrench, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { api } from '../../lib/api';
import { formatDate, formatStatus } from '../../lib/format';

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
  const [searchTerm, setSearchTerm] = useState('');

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
    { label: 'Menunggu', value: stats.pendingRequests, icon: Clock, color: 'yellow' },
    { label: 'Sedang Dikerjakan', value: stats.inProgressRequests, icon: FileText, color: 'blue' },
    { label: 'Selesai', value: stats.completedRequests, icon: CheckCircle, color: 'green' },
    { label: 'Total Permintaan', value: stats.totalRequests, icon: AlertCircle, color: 'gray' },
    { label: 'Mekanik', value: stats.totalMechanics, icon: Wrench, color: 'blue' },
    { label: 'Pelanggan', value: stats.totalCustomers, icon: Users, color: 'blue' },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRecentRequests = recentRequests.filter((request) => {
    if (!normalizedSearch) return true;
    const vehicleLabel = `${request.vehicle?.make ?? ''} ${request.vehicle?.model ?? ''} ${request.vehicle?.license_plate ?? ''}`;
    const target = `${request.customer?.full_name ?? ''} ${request.service_type} ${vehicleLabel} ${request.status}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Beranda Admin
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permintaan Servis Terbaru
            </h3>
            <Link
              to="/admin/service-requests"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
        <CardBody>
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari permintaan servis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : recentRequests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Belum ada permintaan</p>
          ) : filteredRecentRequests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada permintaan yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Pelanggan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Servis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Kendaraan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRecentRequests.map((request) => (
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
                          {formatStatus(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(request.created_at)}
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
