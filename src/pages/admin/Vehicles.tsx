import { FormEvent, useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api, resolveImageUrl } from '../../lib/api';
import type { Vehicle, Profile } from '../../lib/database.types';
import { Car, Eye, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { formatDate } from '../../lib/format';

interface VehicleWithCustomer extends Vehicle {
  customer?: Profile;
}

export function Vehicles() {
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithCustomer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [editFormData, setEditFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
  });

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

  const handleDetail = (vehicle: VehicleWithCustomer) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleEdit = (vehicle: VehicleWithCustomer) => {
    setSelectedVehicle(vehicle);
    setEditFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.license_plate,
    });
    setEditPhotoFile(null);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const updates: Partial<Vehicle> = {
      make: editFormData.make,
      model: editFormData.model,
      year: editFormData.year,
      license_plate: editFormData.licensePlate,
    };

    if (editPhotoFile) {
      updates.photo_url = await api.uploadImage(editPhotoFile);
    }

    await api.updateVehicle(selectedVehicle.id, updates);
    setShowEditModal(false);
    setSelectedVehicle(null);
    setEditPhotoFile(null);
    fetchVehicles();
  };

  const handleDelete = async (vehicle: VehicleWithCustomer) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${vehicle.make} ${vehicle.model}?`
    );
    if (!confirmed) return;
    setDeleteError('');
    try {
      await api.deleteVehicle(vehicle.id);
      fetchVehicles();
    } catch (error) {
      setDeleteError((error as Error).message || 'Gagal menghapus kendaraan.');
    }
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
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari kendaraan berdasarkan merek, model, nomor polisi, atau pemilik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {deleteError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
              {deleteError}
            </div>
          )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                              {vehicle.photo_url ? (
                                <img
                                  src={resolveImageUrl(vehicle.photo_url) ?? ''}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {vehicle.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.customer?.full_name || 'Tidak diketahui'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(vehicle.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDetail(vehicle)}
                          title="Detail Kendaraan"
                          aria-label="Detail Kendaraan"
                          className="px-2 py-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleEdit(vehicle)}
                          title="Perbarui Kendaraan"
                          aria-label="Perbarui Kendaraan"
                          className="ml-2 px-2 py-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(vehicle)}
                          title="Hapus Kendaraan"
                          aria-label="Hapus Kendaraan"
                          className="ml-2 px-2 py-2"
                        >
                          <Trash2 className="h-4 w-4" />
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
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVehicle(null);
        }}
        title="Detail Kendaraan"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                {selectedVehicle.photo_url ? (
                  <img
                    src={resolveImageUrl(selectedVehicle.photo_url) ?? ''}
                    alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Car className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedVehicle.make} {selectedVehicle.model}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedVehicle.license_plate}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex justify-between">
                <span className="font-medium">Pemilik</span>
                <span>{selectedVehicle.customer?.full_name || 'Tidak diketahui'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Merek</span>
                <span>{selectedVehicle.make}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Model</span>
                <span>{selectedVehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tahun</span>
                <span>{selectedVehicle.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Nomor Polisi</span>
                <span>{selectedVehicle.license_plate}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVehicle(null);
          setEditPhotoFile(null);
        }}
        title="Perbarui Kendaraan"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label={
              <span>
                Merek <span className="text-red-500">*</span>
              </span>
            }
            placeholder="contoh: Toyota"
            value={editFormData.make}
            onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
            required
          />
          <Input
            label={
              <span>
                Model <span className="text-red-500">*</span>
              </span>
            }
            placeholder="contoh: Avanza"
            value={editFormData.model}
            onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
            required
          />
          <Input
            type="number"
            label={
              <span>
                Tahun <span className="text-red-500">*</span>
              </span>
            }
            value={editFormData.year}
            onChange={(e) =>
              setEditFormData({ ...editFormData, year: parseInt(e.target.value) })
            }
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
          <Input
            label={
              <span>
                Nomor Polisi <span className="text-red-500">*</span>
              </span>
            }
            placeholder="ABC-1234"
            value={editFormData.licensePlate}
            onChange={(e) =>
              setEditFormData({ ...editFormData, licensePlate: e.target.value })
            }
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Foto Kendaraan (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <Upload className="h-4 w-4" />
                Unggah Foto Baru
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setEditPhotoFile(event.target.files?.[0] ?? null)}
                />
              </label>
              {editPhotoFile ? (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {editPhotoFile.name}
                </span>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Biarkan kosong untuk mempertahankan foto lama
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-4 pt-4">
            <Button type="submit">Simpan Perubahan</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedVehicle(null);
                setEditPhotoFile(null);
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
