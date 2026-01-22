import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatStatus } from '../../lib/format';

export function MechanicDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const data = await api.listServiceRequests({
      assigned_mechanic_id: user.id,
      include: 'vehicle,customer',
      order: 'created_at.desc',
    });

    setStats({
      total: data.length,
      inProgress: data.filter(r => ['in_progress', 'awaiting_payment'].includes(r.status)).length,
      completed: data.filter(r => r.status === 'completed').length,
    });
    setRecentJobs(data.slice(0, 5));

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Beranda Mekanik
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pekerjaan</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Sedang Dikerjakan</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.inProgress}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Selesai</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pekerjaan Terbaru
            </h3>
            <Link
              to="/mechanic/queue"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : recentJobs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Belum ada pekerjaan yang ditugaskan
            </p>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {job.service_type}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {job.vehicle?.make} {job.vehicle?.model} - {job.customer?.full_name}
                    </p>
                  </div>
                  <span
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                      ${job.status === 'awaiting_payment' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : ''}
                      ${job.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                    `}
                  >
                    {formatStatus(job.status)}
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
