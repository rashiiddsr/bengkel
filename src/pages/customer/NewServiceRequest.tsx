import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Input, TextArea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle } from '../../lib/database.types';

const SERVICE_TYPES = [
  'Overhaul Mesin',
  'Overhaul Transmisi Otomatis',
  'Overhaul Transmisi Manual',
  'Sistem Suspensi',
  'Kelistrikan',
  'Servis ECU',
  'Sistem ABS',
  'Central Lock',
  'Pemasangan ECU Racing',
  'Perbaikan Cat & Bodi',
  'Inspeksi Kendaraan',
];

export function NewServiceRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    description: '',
    preferredDate: '',
  });

  const [newVehicle, setNewVehicle] = useState({
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
  };

  const handleAddVehicle = async () => {
    if (!user) return;

    try {
      const data = await api.createVehicle({
        customer_id: user.id,
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        license_plate: newVehicle.licensePlate,
      });

      if (data) {
        setVehicles([data, ...vehicles]);
        setFormData({ ...formData, vehicleId: data.id });
        setShowNewVehicle(false);
        setNewVehicle({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
        });
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    if (!formData.vehicleId) {
      setError('Silakan pilih kendaraan');
      return;
    }

    setLoading(true);

    try {
      await api.createServiceRequest({
        customer_id: user.id,
        vehicle_id: formData.vehicleId,
        service_type: formData.serviceType,
        description: formData.description,
        preferred_date: formData.preferredDate || null,
        status: 'pending',
      });
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      return;
    }

    navigate('/customer/my-requests');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Permintaan Servis Baru
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detail Permintaan Servis</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kendaraan
              </label>
              {!showNewVehicle ? (
                <div className="space-y-2">
                  <Select
                    options={[
                      { value: '', label: 'Pilih kendaraan' },
                      ...vehicles.map(v => ({
                        value: v.id,
                        label: `${v.make} ${v.model} (${v.license_plate})`,
                      })),
                    ]}
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewVehicle(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Tambah Kendaraan Baru
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Merek"
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                      placeholder="contoh: Toyota"
                    />
                    <Input
                      label="Model"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      placeholder="contoh: Avanza"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Tahun"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                    <Input
                      label="Nomor Polisi"
                      value={newVehicle.licensePlate}
                      onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={handleAddVehicle}
                      size="sm"
                    >
                      Tambah Kendaraan
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNewVehicle(false)}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Select
              label="Jenis Servis"
              options={[
                { value: '', label: 'Pilih jenis servis' },
                ...SERVICE_TYPES.map(type => ({ value: type, label: type })),
              ]}
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              required
            />

            <TextArea
              label="Deskripsi"
              placeholder="Jelaskan keluhan atau servis yang dibutuhkan..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
            />

            <Input
              type="date"
              label="Tanggal Servis yang Diinginkan"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            />

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Permintaan'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/customer')}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
