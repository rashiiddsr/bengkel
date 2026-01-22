import { useEffect, useState, type FormEvent } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import type { ServiceType } from '../../lib/database.types';
import { Eye, Pencil, Plus, Search, ClipboardList } from 'lucide-react';
import { formatDateTime } from '../../lib/format';

export function ServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [detailServiceType, setDetailServiceType] = useState<ServiceType | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    const data = await api.listServiceTypes({ order: 'name.asc' });
    setServiceTypes(data);
    setLoading(false);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredServiceTypes = serviceTypes.filter((serviceType) => {
    if (!normalizedSearch) return true;
    const target = `${serviceType.name} ${serviceType.description ?? ''}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedServiceType(null);
    setFormState({ name: '', description: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (serviceType: ServiceType) => {
    setIsEditing(true);
    setSelectedServiceType(serviceType);
    setFormState({
      name: serviceType.name ?? '',
      description: serviceType.description ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (isEditing && selectedServiceType) {
        await api.updateServiceType(selectedServiceType.id, {
          name: formState.name,
          description: formState.description || null,
        });
      } else {
        await api.createServiceType({
          name: formState.name,
          description: formState.description || null,
        });
      }
      setShowModal(false);
      await fetchServiceTypes();
    } catch (error) {
      setFormError((error as Error).message || 'Gagal menyimpan layanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (serviceType: ServiceType) => {
    try {
      await api.updateServiceType(serviceType.id, { is_active: !serviceType.is_active });
      await fetchServiceTypes();
    } catch (error) {
      setFormError((error as Error).message || 'Gagal memperbarui status layanan.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Daftar Layanan
        </h1>
        <Button onClick={handleAdd} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Layanan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Layanan</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari layanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : serviceTypes.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada layanan</p>
          ) : filteredServiceTypes.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada layanan yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nama Layanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredServiceTypes.map((serviceType) => (
                    <tr key={serviceType.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {serviceType.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <p className="max-w-xs truncate">{serviceType.description || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            serviceType.is_active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {serviceType.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailServiceType(serviceType)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                            aria-label="Lihat detail layanan"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(serviceType)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                            aria-label="Edit layanan"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(serviceType)}
                            role="switch"
                            aria-checked={serviceType.is_active}
                            aria-label={serviceType.is_active ? 'Nonaktifkan layanan' : 'Aktifkan layanan'}
                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                              serviceType.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                serviceType.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
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
        isOpen={!!detailServiceType}
        onClose={() => setDetailServiceType(null)}
        title="Detail Layanan"
        size="lg"
      >
        {detailServiceType && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Nama Layanan</p>
                <p className="font-medium text-gray-900 dark:text-white">{detailServiceType.name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detailServiceType.is_active ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Deskripsi</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detailServiceType.description || '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Dibuat</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(detailServiceType.created_at)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Terakhir Diubah</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(detailServiceType.updated_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Edit Layanan' : 'Tambah Layanan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={(
              <>
                Nama Layanan <span className="text-red-500">*</span>
              </>
            )}
            value={formState.name}
            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            required
          />
          <TextArea
            label="Deskripsi"
            value={formState.description}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
          />
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
