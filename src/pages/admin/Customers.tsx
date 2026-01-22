import { useEffect, useState, type FormEvent } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api, type ServiceRequestWithRelations, type UserProfile } from '../../lib/api';
import { formatDate, formatStatus } from '../../lib/format';
import type { Vehicle } from '../../lib/database.types';
import { Eye, Pencil, Search, Users } from 'lucide-react';

export function Customers() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [detailRequests, setDetailRequests] = useState<ServiceRequestWithRelations[]>([]);
  const [detailVehicles, setDetailVehicles] = useState<Vehicle[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const customersData = await api.listProfiles({ role: 'customer', order: 'full_name.asc' });

    if (customersData) {
      setCustomers(customersData);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!selectedCustomer) return;
    const updatedCustomer = customers.find((customer) => customer.id === selectedCustomer.id);
    if (updatedCustomer) {
      setSelectedCustomer(updatedCustomer);
    }
  }, [customers, selectedCustomer]);

  const handleDetail = async (customer: UserProfile) => {
    setSelectedCustomer(customer);
    setDetailLoading(true);
    setDetailRequests([]);
    setDetailVehicles([]);
    try {
      const [requestsRes, vehiclesRes] = await Promise.all([
        api.listServiceRequests({ customer_id: customer.id, include: 'vehicle', order: 'created_at.desc' }),
        api.listVehicles({ customer_id: customer.id, order: 'created_at.desc' }),
      ]);
      setDetailRequests(requestsRes ?? []);
      setDetailVehicles(vehiclesRes ?? []);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEdit = (customer: UserProfile) => {
    setEditingCustomer(customer);
    setEditForm({
      fullName: customer.full_name ?? '',
      username: customer.username ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      password: '',
    });
    setEditError('');
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCustomer) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      await api.updateProfile(editingCustomer.id, {
        full_name: editForm.fullName,
        phone: editForm.phone,
        address: editForm.address || null,
      });

      const userPayload: { email?: string; username?: string; password?: string } = {
        email: editForm.email.trim(),
        username: editForm.username.trim(),
      };
      if (editForm.password) {
        userPayload.password = editForm.password;
      }

      await api.updateUser(editingCustomer.id, userPayload);

      setEditingCustomer(null);
      await fetchCustomers();
    } catch (error) {
      setEditError((error as Error).message || 'Gagal memperbarui pelanggan.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleActive = async (customer: UserProfile) => {
    try {
      await api.updateUser(customer.id, { is_active: !customer.is_active });
      await fetchCustomers();
    } catch (error) {
      setEditError((error as Error).message || 'Gagal memperbarui status pelanggan.');
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedSearch) return true;
    const target = `${customer.full_name} ${customer.username ?? ''} ${customer.email ?? ''} ${customer.phone ?? ''} ${customer.address ?? ''}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Daftar Pelanggan
      </h1>

      <Card>
        <CardBody>
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : customers.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada pelanggan</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada pelanggan yang cocok dengan pencarian
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
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Telepon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                              {customer.avatar_url ? (
                                <img
                                  src={customer.avatar_url}
                                  alt={customer.full_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {customer.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDetail(customer)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                            aria-label="Lihat detail pelanggan"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(customer)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                            aria-label="Edit pelanggan"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(customer)}
                            role="switch"
                            aria-checked={customer.is_active}
                            aria-label={customer.is_active ? 'Nonaktifkan pelanggan' : 'Aktifkan pelanggan'}
                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                              customer.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                customer.is_active ? 'translate-x-6' : 'translate-x-1'
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
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Detail Pelanggan"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Informasi Pelanggan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Nama</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Username</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.username || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Telepon</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.phone || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Alamat</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.address || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedCustomer.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Detail Permintaan Servis
              </h3>
              {detailLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Memuat...</p>
              ) : detailRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Belum ada permintaan servis.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Servis
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Kendaraan
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Tanggal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {detailRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">{request.service_type}</td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            {request.vehicle
                              ? `${request.vehicle.make} ${request.vehicle.model} (${request.vehicle.license_plate})`
                              : '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            {formatStatus(request.status)}
                          </td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            {request.preferred_date ? formatDate(request.preferred_date) : formatDate(request.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Detail Kendaraan
              </h3>
              {detailLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Memuat...</p>
              ) : detailVehicles.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Belum ada kendaraan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Kendaraan
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Tahun
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Nomor Polisi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {detailVehicles.map((vehicle) => (
                        <tr key={vehicle.id}>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {vehicle.make} {vehicle.model}
                          </td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{vehicle.year}</td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{vehicle.license_plate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        title="Edit Pelanggan"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label={(
              <>
                Nama Lengkap <span className="text-red-500">*</span>
              </>
            )}
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            required
          />
          <Input
            label={(
              <>
                Username <span className="text-red-500">*</span>
              </>
            )}
            value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            required
          />
          <Input
            label={(
              <>
                Email <span className="text-red-500">*</span>
              </>
            )}
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <Input
            label="Password Baru (opsional)"
            type="password"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
          />
          <Input
            label={(
              <>
                Telepon <span className="text-red-500">*</span>
              </>
            )}
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            required
          />
          <TextArea
            label="Alamat"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          {editError && (
            <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setEditingCustomer(null)}>
              Batal
            </Button>
            <Button type="submit" disabled={editSubmitting}>
              {editSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
