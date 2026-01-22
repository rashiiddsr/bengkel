import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input, TextArea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Edit } from 'lucide-react';
import { formatCurrency, formatStatus } from '../../lib/format';

export function ServiceQueue() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

    const data = await api.listServiceRequests({
      assigned_mechanic_id: user.id,
      status: 'approved,in_progress,parts_needed,quality_check',
      include: 'vehicle,customer',
      order: 'created_at.desc',
    });

    setJobs(data);
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

    await api.updateServiceRequest(selectedJob.id, updates);
    await api.createStatusHistory({
        service_request_id: selectedJob.id,
        status: editForm.status,
        notes: editForm.mechanicNotes,
        changed_by: user.id,
      });

    setSelectedJob(null);
    fetchJobs();
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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    if (!normalizedSearch) return true;
    const vehicleLabel = `${job.vehicle?.make ?? ''} ${job.vehicle?.model ?? ''} ${job.vehicle?.license_plate ?? ''}`;
    const customerLabel = `${job.customer?.full_name ?? ''} ${job.customer?.phone ?? ''}`;
    const target = `${job.service_type} ${vehicleLabel} ${customerLabel} ${job.status}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Antrian Servis
      </h1>

      <Card>
        <CardBody>
          <div className="mb-4 max-w-md">
            <Input
              placeholder="Cari pekerjaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada pekerjaan aktif di antrian
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
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Perkiraan Biaya
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
                          {formatStatus(job.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {job.estimated_cost ? formatCurrency(job.estimated_cost) : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(job)}
                          title="Perbarui Status"
                          aria-label="Perbarui Status"
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
        title="Perbarui Status Servis"
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Kendaraan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedJob.vehicle?.make} {selectedJob.vehicle?.model}
                </p>
              </div>
            </div>

            {selectedJob.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Keluhan Pelanggan</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.description}
                </p>
              </div>
            )}

            {selectedJob.admin_notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Catatan Admin</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedJob.admin_notes}
                </p>
              </div>
            )}

            <Select
              label="Status"
              options={[
                { value: 'approved', label: 'Disetujui (Belum Mulai)' },
                { value: 'in_progress', label: 'Sedang Dikerjakan' },
                { value: 'parts_needed', label: 'Menunggu Suku Cadang' },
                { value: 'quality_check', label: 'Pemeriksaan Kualitas' },
                { value: 'completed', label: 'Selesai' },
              ]}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />

            <Input
              type="number"
              label="Biaya Akhir"
              placeholder="Masukkan biaya akhir"
              value={editForm.finalCost}
              onChange={(e) => setEditForm({ ...editForm, finalCost: e.target.value })}
              step="0.01"
            />

            <TextArea
              label="Catatan Mekanik"
              placeholder="Tambahkan catatan servis..."
              value={editForm.mechanicNotes}
              onChange={(e) => setEditForm({ ...editForm, mechanicNotes: e.target.value })}
              rows={4}
            />

            <div className="flex space-x-4 pt-4">
              <Button onClick={handleUpdate}>Perbarui Status</Button>
              <Button variant="secondary" onClick={() => setSelectedJob(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
