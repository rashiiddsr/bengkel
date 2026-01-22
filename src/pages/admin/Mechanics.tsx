import { useEffect, useState, type FormEvent } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api, type UserProfile } from '../../lib/api';
import { Eye, Pencil, Plus, Search, Wrench } from 'lucide-react';

export function Mechanics() {
  const [mechanics, setMechanics] = useState<UserProfile[]>([]);
  const [mechanicStats, setMechanicStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<UserProfile | null>(null);
  const [detailMechanic, setDetailMechanic] = useState<UserProfile | null>(null);
  const [formState, setFormState] = useState({
    fullName: '',
    phone: '',
    address: '',
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    const mechanicsData = await api.listProfiles({ role: 'mechanic', order: 'full_name.asc' });

    if (mechanicsData) {
      setMechanics(mechanicsData);

      const stats: Record<string, any> = {};
      for (const mechanic of mechanicsData) {
        const requests = await api.listServiceRequests({ assigned_mechanic_id: mechanic.id });

        stats[mechanic.id] = {
          total: requests.length || 0,
          inProgress: requests.filter(r => ['approved', 'in_progress', 'parts_needed', 'quality_check'].includes(r.status)).length || 0,
          completed: requests.filter(r => r.status === 'completed').length || 0,
        };
      }
      setMechanicStats(stats);
    }

    setLoading(false);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredMechanics = mechanics.filter((mechanic) => {
    if (!normalizedSearch) return true;
    const target = `${mechanic.full_name} ${mechanic.email ?? ''} ${mechanic.phone ?? ''} ${mechanic.address ?? ''}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedMechanic(null);
    setFormState({
      fullName: '',
      phone: '',
      address: '',
      email: '',
      password: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (mechanic: UserProfile) => {
    setIsEditing(true);
    setSelectedMechanic(mechanic);
    setFormState({
      fullName: mechanic.full_name ?? '',
      phone: mechanic.phone ?? '',
      address: mechanic.address ?? '',
      email: mechanic.email ?? '',
      password: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (isEditing && selectedMechanic) {
        await api.updateProfile(selectedMechanic.id, {
          full_name: formState.fullName,
          phone: formState.phone,
          address: formState.address || null,
        });
        const userPayload: { email?: string; password?: string } = {
          email: formState.email.trim(),
        };
        if (formState.password) {
          userPayload.password = formState.password;
        }
        await api.updateUser(selectedMechanic.id, userPayload);
      } else {
        await api.createMechanic({
          full_name: formState.fullName,
          email: formState.email,
          password: formState.password,
          phone: formState.phone,
          address: formState.address || null,
        });
      }
      setShowModal(false);
      await fetchMechanics();
    } catch (error) {
      setFormError((error as Error).message || 'Gagal menyimpan mekanik.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (mechanic: UserProfile) => {
    try {
      await api.updateUser(mechanic.id, { is_active: !mechanic.is_active });
      await fetchMechanics();
    } catch (error) {
      setFormError((error as Error).message || 'Gagal memperbarui status mekanik.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Daftar Mekanik
      </h1>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari mekanik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAdd} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Mekanik
            </Button>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : mechanics.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada mekanik</p>
          ) : filteredMechanics.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada mekanik yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Total Pekerjaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Sedang Dikerjakan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Selesai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMechanics.map((mechanic) => (
                    <tr key={mechanic.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {mechanic.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {mechanicStats[mechanic.id]?.total || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                        {mechanicStats[mechanic.id]?.inProgress || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {mechanicStats[mechanic.id]?.completed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailMechanic(mechanic)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                            aria-label="Lihat detail mekanik"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(mechanic)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                            aria-label="Edit mekanik"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(mechanic)}
                            role="switch"
                            aria-checked={mechanic.is_active}
                            aria-label={mechanic.is_active ? 'Nonaktifkan mekanik' : 'Aktifkan mekanik'}
                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                              mechanic.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                mechanic.is_active ? 'translate-x-6' : 'translate-x-1'
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
        isOpen={!!detailMechanic}
        onClose={() => setDetailMechanic(null)}
        title="Detail Mekanik"
        size="lg"
      >
        {detailMechanic && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Nama</p>
                <p className="font-medium text-gray-900 dark:text-white">{detailMechanic.full_name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{detailMechanic.email || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Telepon</p>
                <p className="font-medium text-gray-900 dark:text-white">{detailMechanic.phone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {detailMechanic.is_active ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Alamat</p>
                <p className="font-medium text-gray-900 dark:text-white">{detailMechanic.address || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Ringkasan Pekerjaan</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Pekerjaan</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {mechanicStats[detailMechanic.id]?.total || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sedang Dikerjakan</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {mechanicStats[detailMechanic.id]?.inProgress || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Selesai</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {mechanicStats[detailMechanic.id]?.completed || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Edit Mekanik' : 'Tambah Mekanik'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={(
              <>
                Nama Lengkap <span className="text-red-500">*</span>
              </>
            )}
            value={formState.fullName}
            onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
            required
          />
          <Input
            label={(
              <>
                Email <span className="text-red-500">*</span>
              </>
            )}
            type="email"
            value={formState.email}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            required
          />
          <Input
            label={isEditing ? 'Password Baru (opsional)' : (
              <>
                Password <span className="text-red-500">*</span>
              </>
            )}
            type="password"
            value={formState.password}
            onChange={(e) => setFormState({ ...formState, password: e.target.value })}
            required={!isEditing}
          />
          <Input
            label={(
              <>
                Telepon <span className="text-red-500">*</span>
              </>
            )}
            value={formState.phone}
            onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
            required
          />
          <TextArea
            label="Alamat"
            value={formState.address}
            onChange={(e) => setFormState({ ...formState, address: e.target.value })}
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
