import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle } from '../../lib/database.types';
import { Plus, Car, ImageUp } from 'lucide-react';

export function MyVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;

    const data = await api.listVehicles({
      customer_id: user.id,
      order: 'created_at.desc',
    });

    setVehicles(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await api.createVehicle({
      customer_id: user.id,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      license_plate: formData.licensePlate,
    });

    setShowModal(false);
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
    });
    fetchVehicles();
  };

  const handlePhotoEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setPhotoUrl(vehicle.photo_url ?? '');
    setShowPhotoModal(true);
  };

  const handlePhotoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    await api.updateVehicle(selectedVehicle.id, {
      photo_url: photoUrl.trim() ? photoUrl.trim() : null,
    });

    setShowPhotoModal(false);
    setSelectedVehicle(null);
    setPhotoUrl('');
    fetchVehicles();
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!normalizedSearch) return true;
    const target = `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.license_plate}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Kendaraan Saya
        </h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Tambah Kendaraan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kendaraan</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="mb-4 max-w-md">
            <Input
              placeholder="Cari kendaraan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Memuat...
            </p>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Belum ada kendaraan yang ditambahkan
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Tambahkan Kendaraan Pertama
              </Button>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada kendaraan yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kendaraan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tahun
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nomor Polisi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                              {vehicle.photo_url ? (
                                <img
                                  src={vehicle.photo_url}
                                  alt={`${vehicle.make} ${vehicle.model}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePhotoEdit(vehicle)}
                          title="Ubah Foto Kendaraan"
                          aria-label="Ubah Foto Kendaraan"
                        >
                          <ImageUp className="h-4 w-4" />
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
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Kendaraan Baru"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Merek"
            placeholder="contoh: Toyota"
            value={formData.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            required
          />
          <Input
            label="Model"
            placeholder="contoh: Avanza"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />
          <Input
            type="number"
            label="Tahun"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
          <Input
            label="Nomor Polisi"
            placeholder="ABC-1234"
            value={formData.licensePlate}
            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            required
          />
          <div className="flex space-x-4 pt-4">
            <Button type="submit">Tambah Kendaraan</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setSelectedVehicle(null);
          setPhotoUrl('');
        }}
        title="Ubah Foto Kendaraan"
      >
        <form onSubmit={handlePhotoUpdate} className="space-y-4">
          <Input
            label="URL Foto Kendaraan"
            placeholder="https://contoh.com/foto-kendaraan.jpg"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <div className="flex space-x-4 pt-4">
            <Button type="submit">Simpan Foto</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPhotoModal(false);
                setSelectedVehicle(null);
                setPhotoUrl('');
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
