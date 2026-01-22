import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input, TextArea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, Eye, Search, CheckCircle, Upload } from 'lucide-react';
import { formatCurrency, formatStatus } from '../../lib/format';

const REFRESH_INTERVAL = 30000;

export function ServiceQueue() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [detailJob, setDetailJob] = useState<any | null>(null);
  const [progressJob, setProgressJob] = useState<any | null>(null);
  const [statusJob, setStatusJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [progressForm, setProgressForm] = useState({
    progressDate: '',
    description: '',
    photoFile: null as File | null,
    photoDescription: '',
  });

  const [statusForm, setStatusForm] = useState({
    status: 'awaiting_payment',
    mechanicNotes: '',
  });

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    const intervalId = window.setInterval(() => {
      fetchJobs();
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    const data = await api.listServiceRequests({
      assigned_mechanic_id: user.id,
      status: 'in_progress',
      include: 'vehicle,customer',
      order: 'created_at.desc',
    });

    setJobs(data);
    setLoading(false);
  };

  const handleOpenProgress = (job: any) => {
    setProgressJob(job);
    setProgressForm({
      progressDate: new Date().toISOString().split('T')[0],
      description: '',
      photoFile: null,
      photoDescription: '',
    });
  };

  const handleOpenStatus = (job: any) => {
    setStatusJob(job);
    setStatusForm({
      status: 'awaiting_payment',
      mechanicNotes: job.mechanic_notes || '',
    });
  };

  const handleCreateProgress = async () => {
    if (!progressJob || !user) return;
    if (!progressForm.progressDate || !progressForm.description.trim()) {
      window.alert('Tanggal update dan deskripsi progres wajib diisi.');
      return;
    }

    const progress = await api.createServiceProgress({
      service_request_id: progressJob.id,
      progress_date: progressForm.progressDate,
      description: progressForm.description.trim(),
      created_by: user.id,
    });

    if (progressForm.photoFile) {
      const photoUrl = await api.uploadImage(progressForm.photoFile);
      await api.createServicePhoto({
        service_request_id: progressJob.id,
        service_progress_id: progress.id,
        photo_url: photoUrl,
        description: progressForm.photoDescription.trim() || null,
        uploaded_by: user.id,
      });
    }

    setProgressJob(null);
    fetchJobs();
  };

  const handleUpdateStatus = async () => {
    if (!statusJob || !user) return;
    if (!statusForm.mechanicNotes.trim()) {
      window.alert('Catatan mekanik wajib diisi sebelum memperbarui status.');
      return;
    }

    const confirmed = window.confirm(
      'Setelah status diperbarui, servis akan berpindah ke menu Pekerjaan Selesai dan status admin menjadi Menunggu Pembayaran. Lanjutkan?'
    );
    if (!confirmed) return;

    await api.updateServiceRequest(statusJob.id, {
      status: statusForm.status,
      mechanic_notes: statusForm.mechanicNotes.trim(),
    });
    await api.createStatusHistory({
      service_request_id: statusJob.id,
      status: statusForm.status,
      notes: statusForm.mechanicNotes.trim(),
      changed_by: user.id,
    });

    setStatusJob(null);
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      awaiting_payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
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
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari pekerjaan..."
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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDetailJob(job)}
                            title="Lihat Detail"
                            aria-label="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenProgress(job)}
                            title="Laporan Kondisi"
                            aria-label="Laporan Kondisi"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenStatus(job)}
                            title="Perbarui Status"
                            aria-label="Perbarui Status"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
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
        isOpen={!!detailJob}
        onClose={() => setDetailJob(null)}
        title="Detail Servis"
        size="lg"
      >
        {detailJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pemilik</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detailJob.customer?.full_name ?? '-'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {detailJob.customer?.phone ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mobil</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detailJob.vehicle?.make} {detailJob.vehicle?.model}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {detailJob.vehicle?.license_plate}
                </p>
              </div>
            </div>

            {detailJob.admin_notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Catatan Admin</p>
                <p className="text-gray-900 dark:text-white">
                  {detailJob.admin_notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!progressJob}
        onClose={() => setProgressJob(null)}
        title="Laporan Kondisi Servis"
        size="lg"
      >
        {progressJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jenis Servis</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {progressJob.service_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kendaraan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {progressJob.vehicle?.make} {progressJob.vehicle?.model}
                </p>
              </div>
            </div>

            <Input
              type="date"
              label={
                <span>
                  Tanggal Update <span className="text-red-500">*</span>
                </span>
              }
              value={progressForm.progressDate}
              onChange={(e) => setProgressForm({ ...progressForm, progressDate: e.target.value })}
            />

            <TextArea
              label={
                <span>
                  Deskripsi Progres <span className="text-red-500">*</span>
                </span>
              }
              placeholder="Jelaskan progres servis..."
              value={progressForm.description}
              onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })}
              rows={4}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Foto Progres (Opsional)
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <Upload className="h-4 w-4" />
                  Unggah Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setProgressForm({ ...progressForm, photoFile: event.target.files?.[0] ?? null })
                    }
                  />
                </label>
                {progressForm.photoFile ? (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {progressForm.photoFile.name}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada foto dipilih
                  </span>
                )}
              </div>
            </div>

            <TextArea
              label="Deskripsi Foto (Opsional)"
              placeholder="Tambahkan keterangan foto..."
              value={progressForm.photoDescription}
              onChange={(e) =>
                setProgressForm({ ...progressForm, photoDescription: e.target.value })
              }
              rows={3}
            />

            <div className="flex space-x-4 pt-4">
              <Button onClick={handleCreateProgress}>Simpan Progres</Button>
              <Button variant="secondary" onClick={() => setProgressJob(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!statusJob}
        onClose={() => setStatusJob(null)}
        title="Perbarui Status Servis"
        size="lg"
      >
        {statusJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jenis Servis</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {statusJob.service_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kendaraan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {statusJob.vehicle?.make} {statusJob.vehicle?.model}
                </p>
              </div>
            </div>

            <Select
              label="Status"
              options={[
                { value: 'awaiting_payment', label: 'Menunggu Pembayaran' },
              ]}
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            />

            <TextArea
              label={
                <span>
                  Catatan Mekanik <span className="text-red-500">*</span>
                </span>
              }
              placeholder="Tambahkan catatan servis..."
              value={statusForm.mechanicNotes}
              onChange={(e) => setStatusForm({ ...statusForm, mechanicNotes: e.target.value })}
              rows={4}
            />

            <div className="flex space-x-4 pt-4">
              <Button onClick={handleUpdateStatus}>Perbarui Status</Button>
              <Button variant="secondary" onClick={() => setStatusJob(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
