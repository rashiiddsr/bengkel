import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input, TextArea, Select } from '../../components/ui/Input';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ServiceRequest, Vehicle, StatusHistory, Profile } from '../../lib/database.types';
import { Eye, Clock, Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate, formatDateTime, formatStatus } from '../../lib/format';

interface RequestWithDetails extends ServiceRequest {
  vehicle?: Vehicle;
  mechanic?: Profile;
  history?: StatusHistory[];
}

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

export function MyRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    description: '',
    preferredDate: '',
  });

  useEffect(() => {
    fetchRequests();
    fetchVehicles();
  }, [user]);

  useEffect(() => {
    const state = location.state as { openNewRequest?: boolean } | null;
    if (state?.openNewRequest) {
      setShowCreateModal(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const fetchRequests = async () => {
    if (!user) return;

    const data = await api.listServiceRequests({
      customer_id: user.id,
      include: 'vehicle,mechanic',
      order: 'created_at.desc',
    });

    setRequests(data as RequestWithDetails[]);
    setLoading(false);
  };

  const fetchVehicles = async () => {
    if (!user) return;

    const data = await api.listVehicles({
      customer_id: user.id,
      order: 'created_at.desc',
    });

    setVehicles(data);
  };

  const fetchHistory = async (requestId: string) => {
    return api.listStatusHistory({
      service_request_id: requestId,
      include: 'changed_by_profile',
      order: 'created_at.desc',
    });
  };

  const handleViewDetails = async (request: RequestWithDetails) => {
    const history = await fetchHistory(request.id);
    setSelectedRequest({ ...request, history });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!user) return;

    if (!formData.vehicleId) {
      setCreateError('Silakan pilih kendaraan');
      return;
    }

    setCreateLoading(true);

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
      setCreateError((error as Error).message);
      setCreateLoading(false);
      return;
    }

    setShowCreateModal(false);
    setCreateLoading(false);
    setFormData({
      vehicleId: '',
      serviceType: '',
      description: '',
      preferredDate: '',
    });
    fetchRequests();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      parts_needed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      quality_check: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => {
    if (!normalizedSearch) return true;
    const vehicleLabel = `${request.vehicle?.make ?? ''} ${request.vehicle?.model ?? ''} ${request.vehicle?.license_plate ?? ''}`;
    const target = `${request.service_type} ${vehicleLabel} ${request.status}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Permintaan Servis Saya
        </h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Tambah Permintaan
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari permintaan servis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Memuat...
            </p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada permintaan servis
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada permintaan yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Jenis Servis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kendaraan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {request.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.vehicle?.make} {request.vehicle?.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {formatStatus(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewDetails(request)}
                          title="Lihat Detail"
                          aria-label="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
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
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Detail Permintaan Servis"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jenis Servis</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.service_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                  {formatStatus(selectedRequest.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kendaraan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.vehicle?.make} {selectedRequest.vehicle?.model} ({selectedRequest.vehicle?.license_plate})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mekanik Ditugaskan</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.mechanic?.full_name || 'Belum ditugaskan'}
                </p>
              </div>
            </div>

            {selectedRequest.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Deskripsi</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.description}
                </p>
              </div>
            )}

            {selectedRequest.estimated_cost && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Perkiraan Biaya</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(selectedRequest.estimated_cost)}
                </p>
              </div>
            )}

            {selectedRequest.final_cost && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Biaya Akhir</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedRequest.final_cost)}
                </p>
              </div>
            )}

            {selectedRequest.mechanic_notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Catatan Mekanik</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.mechanic_notes}
                </p>
              </div>
            )}

            {selectedRequest.history && selectedRequest.history.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Riwayat Status</p>
                <div className="space-y-2">
                  {selectedRequest.history.map((entry: any) => (
                    <div key={entry.id} className="flex items-start space-x-3 text-sm">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          Status berubah menjadi <span className="font-medium">{formatStatus(entry.status)}</span>
                        </p>
                        {entry.notes && (
                          <p className="text-gray-600 dark:text-gray-400">{entry.notes}</p>
                        )}
                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                          {formatDateTime(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateError('');
        }}
        title="Tambah Permintaan Servis"
        size="lg"
      >
        {createError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {createError}
          </div>
        )}
        <form onSubmit={handleCreateRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kendaraan <span className="text-red-500">*</span>
            </label>
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
          </div>

          <Select
            label={
              <>
                Jenis Servis <span className="text-red-500">*</span>
              </>
            }
            options={[
              { value: '', label: 'Pilih jenis servis' },
              ...SERVICE_TYPES.map(type => ({ value: type, label: type })),
            ]}
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            required
          />

          <TextArea
            label={
              <>
                Deskripsi <span className="text-red-500">*</span>
              </>
            }
            placeholder="Jelaskan keluhan atau servis yang dibutuhkan..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            required
          />

          <Input
            type="date"
            label={
              <>
                Tanggal Servis yang Diinginkan <span className="text-red-500">*</span>
              </>
            }
            value={formData.preferredDate}
            onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            required
          />

          <div className="flex space-x-4">
            <Button type="submit" disabled={createLoading}>
              {createLoading ? 'Mengirim...' : 'Kirim Permintaan'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
