import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { api } from '../../lib/api';
import type { Vehicle, Profile } from '../../lib/database.types';
import { Car } from 'lucide-react';
import { formatDate } from '../../lib/format';

interface VehicleWithCustomer extends Vehicle {
  customer?: Profile;
}

export function Vehicles() {
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const data = await api.listVehicles({ include: 'customer', order: 'created_at.desc' });

    if (data) {
      setVehicles(data as VehicleWithCustomer[]);
    }
    setLoading(false);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!normalizedSearch) return true;
    const target = `${vehicle.make} ${vehicle.model} ${vehicle.license_plate} ${vehicle.customer?.full_name ?? ''}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Kelola Kendaraan
      </h1>

      <Card>
        <CardBody>
          <div className="mb-4 max-w-md">
            <Input
              placeholder="Cari kendaraan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada kendaraan</p>
          ) : filteredVehicles.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada kendaraan yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Kendaraan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Tahun
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nomor Polisi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Pemilik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Tanggal Input
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {vehicle.make} {vehicle.model}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {vehicle.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.customer?.full_name || 'Tidak diketahui'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(vehicle.created_at)}
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
