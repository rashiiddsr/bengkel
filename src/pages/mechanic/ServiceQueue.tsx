import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input, TextArea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api, resolveImageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, Eye, Search, CheckCircle, Upload } from 'lucide-react';
import { formatCurrency, formatDate, formatStatus } from '../../lib/format';
import type { ServicePhoto, ServiceProgress } from '../../lib/database.types';
import { parseMechanicNotes, serializeMechanicNotes, type MechanicNoteItem } from '../../lib/mechanicNotes';

const REFRESH_INTERVAL = 30000;

export function ServiceQueue() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [detailJob, setDetailJob] = useState<any | null>(null);
  const [detailProgress, setDetailProgress] = useState<ServiceProgress[]>([]);
  const [detailPhotos, setDetailPhotos] = useState<ServicePhoto[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
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
    mechanicNotes: [] as { note: string; cost: string }[],
  });

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    const intervalId = window.setInterval(() => {
      fetchJobs();
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (!detailJob) {
      setDetailProgress([]);
      setDetailPhotos([]);
      setDetailLoading(false);
      return;
    }

    const fetchProgress = async () => {
      setDetailLoading(true);
      try {
        const [progressRes, photoRes] = await Promise.all([
          api.listServiceProgress({ service_request_id: detailJob.id, order: 'progress_date.desc' }),
          api.listServicePhotos({ service_request_id: detailJob.id, order: 'created_at.desc' }),
        ]);
        setDetailProgress(progressRes ?? []);
        setDetailPhotos(photoRes ?? []);
      } catch (error) {
        console.error(error);
        setDetailProgress([]);
        setDetailPhotos([]);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchProgress();
  }, [detailJob]);

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
    const parsedNotes = parseMechanicNotes(job.mechanic_notes);
    setStatusJob(job);
    setStatusForm({
      status: 'awaiting_payment',
      mechanicNotes:
        parsedNotes.length > 0
          ? parsedNotes.map((item) => ({
            note: item.note,
            cost: item.cost !== null && item.cost !== undefined ? item.cost.toString() : '',
          }))
          : [{ note: '', cost: '' }],
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
    const preparedNotes: MechanicNoteItem[] = statusForm.mechanicNotes
      .map((item) => ({
        note: item.note.trim(),
        cost: null,
      }))
      .filter((item) => item.note || item.cost !== null);

    if (preparedNotes.length === 0 || preparedNotes.some((item) => !item.note)) {
      window.alert('Catatan mekanik wajib diisi sebelum memperbarui status.');
      return;
    }

    const confirmed = window.confirm(
      'Setelah status diperbarui, servis akan berpindah ke menu Pekerjaan Selesai dan status admin menjadi Menunggu Pembayaran. Lanjutkan?'
    );
    if (!confirmed) return;

    await api.updateServiceRequest(statusJob.id, {
      status: statusForm.status,
      mechanic_notes: serializeMechanicNotes(preparedNotes),
    });
    const notesSummary = preparedNotes
      .map((item, index) => `${index + 1}. ${item.note}`)
      .join(' ');
    await api.createStatusHistory({
      service_request_id: statusJob.id,
      status: statusForm.status,
      notes: notesSummary,
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

  const handleAddMechanicNote = () => {
    setStatusForm((prev) => ({
      ...prev,
      mechanicNotes: [...prev.mechanicNotes, { note: '', cost: '' }],
    }));
  };

  const handleRemoveMechanicNote = (index: number) => {
    setStatusForm((prev) => ({
      ...prev,
      mechanicNotes: prev.mechanicNotes.filter((_, noteIndex) => noteIndex !== index),
    }));
  };

  const renderMechanicNotes = (rawNotes?: string | null) => {
    const items = parseMechanicNotes(rawNotes);
    if (items.length === 0) return null;

    return (
      <ol className="list-decimal space-y-1 pl-5 text-gray-900 dark:text-white">
        {items.map((item, index) => (
          <li key={`${item.note}-${index}`} className="flex items-start justify-between gap-4">
            <span>{item.note}</span>
            {item.cost !== null && item.cost !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-300">
                {formatCurrency(item.cost)}
              </span>
            )}
          </li>
        ))}
      </ol>
    );
  };

  const mechanicNotesContent = renderMechanicNotes(detailJob?.mechanic_notes);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Antrian Servis
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Antrian Servis</CardTitle>
        </CardHeader>
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

            {mechanicNotesContent && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Catatan Mekanik</p>
                {mechanicNotesContent}
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Laporan Kondisi Servis</p>
              {detailLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Memuat laporan...</p>
              ) : detailProgress.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada laporan kondisi.</p>
              ) : (
                <div className="space-y-3">
                  {detailProgress.map((progress) => {
                    const photos = detailPhotos.filter((photo) => photo.service_progress_id === progress.id);
                    return (
                      <div key={progress.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(progress.progress_date)}
                        </p>
                        <p className="text-gray-900 dark:text-white">{progress.description}</p>
                        {photos.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                            {photos.map((photo) => {
                              const resolved = resolveImageUrl(photo.photo_url);
                              return (
                                <div key={photo.id} className="rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                                  {resolved ? (
                                    <img
                                      src={resolved}
                                      alt={photo.description ?? 'Foto progres servis'}
                                      className="h-24 w-full rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-24 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                      Foto tidak tersedia
                                    </div>
                                  )}
                                  {photo.description && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{photo.description}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Catatan Mekanik <span className="text-red-500">*</span>
                </p>
                <Button variant="secondary" onClick={handleAddMechanicNote}>
                  Tambah Catatan
                </Button>
              </div>
              <div className="space-y-3">
                {statusForm.mechanicNotes.map((item, index) => (
                  <div key={`mechanic-note-${index}`} className="rounded-lg border border-dashed border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <Input
                        label={`Catatan ${index + 1}`}
                        placeholder="Tambahkan catatan servis..."
                        value={item.note}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStatusForm((prev) => ({
                            ...prev,
                            mechanicNotes: prev.mechanicNotes.map((note, noteIndex) =>
                              noteIndex === index ? { ...note, note: value } : note
                            ),
                          }));
                        }}
                      />
                      {statusForm.mechanicNotes.length > 1 && (
                        <Button variant="secondary" onClick={() => handleRemoveMechanicNote(index)}>
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
