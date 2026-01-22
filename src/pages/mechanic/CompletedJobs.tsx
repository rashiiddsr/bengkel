import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, Search } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format';

export function CompletedJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    const data = await api.listServiceRequests({
      assigned_mechanic_id: user.id,
      status: 'completed',
      include: 'vehicle,customer',
      order: 'updated_at.desc',
    });

    setJobs(data);
    setLoading(false);
  };

  const handleView = (job: any) => {
    setSelectedJob(job);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    if (!normalizedSearch) return true;
    const vehicleLabel = `${job.vehicle?.make ?? ''} ${job.vehicle?.model ?? ''} ${job.vehicle?.license_plate ?? ''}`;
    const customerLabel = job.customer?.full_name ?? '';
    const target = `${job.service_type} ${vehicleLabel} ${customerLabel}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Pekerjaan Selesai
      </h1>

      <Card>
        <CardBody>
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari pekerjaan selesai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Belum ada pekerjaan selesai
            </p>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada pekerjaan yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Jenis Servis
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Kendaraan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Pelanggan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Biaya Akhir
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Tanggal Selesai
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredJobs.map((job) => (
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
                        {job.total_cost ? formatCurrency(job.total_cost) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(job.updated_at)}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleView(job)}
                          title="Lihat Detail"
                          aria-label="Lihat Detail"
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
        title="Detail Pekerjaan"
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jenis Servis</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.service_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  SELESAI
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kendaraan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.vehicle?.make} {selectedJob.vehicle?.model} ({selectedJob.vehicle?.license_plate})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pelanggan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.customer?.full_name}
                </p>
              </div>
            </div>

            {selectedJob.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Deskripsi Awal</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.description}
                </p>
              </div>
            )}

            {selectedJob.mechanic_notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Catatan Pekerjaan</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.mechanic_notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedJob.estimated_cost && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Perkiraan Biaya</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(selectedJob.estimated_cost)}
                  </p>
                </div>
              )}
              {selectedJob.total_cost && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Biaya</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedJob.total_cost)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Selesai</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(selectedJob.updated_at)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
