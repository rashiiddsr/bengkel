import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api, type ServiceRequestWithRelations } from '../../lib/api';
import type { Profile, Vehicle } from '../../lib/database.types';
import { Search, Users } from 'lucide-react';

export function Customers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
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

  const handleDetail = async (customer: Profile) => {
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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedSearch) return true;
    const target = `${customer.full_name} ${customer.phone ?? ''} ${customer.address ?? ''}`.toLowerCase();
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
                      Telepon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Alamat
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
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                        {customer.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {customer.address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <Button variant="secondary" size="sm" onClick={() => handleDetail(customer)}>
                          Detail
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
                  <p className="text-gray-500 dark:text-gray-400">Telepon</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.phone || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Alamat</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.address || '-'}</p>
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
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{request.status}</td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            {request.preferred_date || '-'}
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
    </div>
  );
}
