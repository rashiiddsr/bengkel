import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ServiceRequest, Profile } from '../../lib/database.types';
import { Edit, Search } from 'lucide-react';
import { formatCurrency, formatStatus } from '../../lib/format';

interface RequestWithDetails extends ServiceRequest {
  customer?: Profile;
  mechanic?: Profile;
  vehicle?: any;
}

export function ServiceRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [mechanics, setMechanics] = useState<Profile[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [editForm, setEditForm] = useState({
    status: '',
    assignedMechanicId: '',
    estimatedCost: '',
    finalCost: '',
    adminNotes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [requestsRes, mechanicsRes] = await Promise.all([
      api.listServiceRequests({ include: 'customer,mechanic,vehicle', order: 'created_at.desc' }),
      api.listProfiles({ role: 'mechanic', order: 'full_name.asc' }),
    ]);

    if (requestsRes) setRequests(requestsRes as RequestWithDetails[]);
    if (mechanicsRes) setMechanics(mechanicsRes);
    setLoading(false);
  };

  const handleEdit = (request: RequestWithDetails) => {
    setSelectedRequest(request);
    setEditForm({
      status: request.status,
      assignedMechanicId: request.assigned_mechanic_id || '',
      estimatedCost: request.estimated_cost?.toString() || '',
      finalCost: request.final_cost?.toString() || '',
      adminNotes: request.admin_notes || '',
    });
  };

  const handleUpdate = async () => {
    if (!selectedRequest || !user) return;

    const updates: any = {
      status: editForm.status,
      assigned_mechanic_id: editForm.assignedMechanicId || null,
      admin_notes: editForm.adminNotes,
    };

    if (editForm.estimatedCost) {
      updates.estimated_cost = parseFloat(editForm.estimatedCost);
    }

    if (editForm.finalCost) {
      updates.final_cost = parseFloat(editForm.finalCost);
    }

    await api.updateServiceRequest(selectedRequest.id, updates);
    await api.createStatusHistory({
        service_request_id: selectedRequest.id,
        status: editForm.status,
        notes: `Diperbarui oleh admin: ${editForm.adminNotes}`,
        changed_by: user.id,
      });

    setSelectedRequest(null);
    fetchData();
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
    if (filterStatus !== 'all' && request.status !== filterStatus) {
      return false;
    }
    if (!normalizedSearch) return true;
    const vehicleLabel = `${request.vehicle?.make ?? ''} ${request.vehicle?.model ?? ''} ${request.vehicle?.license_plate ?? ''}`;
    const mechanicLabel = request.mechanic?.full_name ?? '';
    const customerLabel = request.customer?.full_name ?? '';
    const target = `${customerLabel} ${request.service_type} ${vehicleLabel} ${mechanicLabel} ${request.status}`.toLowerCase();
    return target.includes(normalizedSearch);
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Daftar Servis
      </h1>

      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full">
          <Select
            options={[
              { value: 'all', label: 'Semua Permintaan' },
              { value: 'pending', label: 'Menunggu' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'in_progress', label: 'Sedang Dikerjakan' },
              { value: 'completed', label: 'Selesai' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
        <div className="w-full">
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
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada permintaan</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada permintaan yang cocok dengan pencarian
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Pelanggan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Servis
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Kendaraan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Mekanik
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Biaya
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {request.customer?.full_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {request.service_type}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {request.vehicle?.make} {request.vehicle?.model}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {request.mechanic?.full_name || 'Belum Ditugaskan'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                          {formatStatus(request.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {request.final_cost
                          ? formatCurrency(request.final_cost)
                          : request.estimated_cost
                            ? `~${formatCurrency(request.estimated_cost)}`
                            : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(request)}
                          title="Edit Permintaan"
                          aria-label="Edit Permintaan"
                        >
                          <Edit className="h-4 w-4" />
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
        title="Edit Permintaan Servis"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pelanggan</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedRequest.customer?.full_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Jenis Servis</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedRequest.service_type}
              </p>
            </div>

            {selectedRequest.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Deskripsi</p>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.description}
                </p>
              </div>
            )}

            <Select
              label="Status"
              options={[
                { value: 'pending', label: 'Menunggu' },
                { value: 'approved', label: 'Disetujui' },
                { value: 'in_progress', label: 'Sedang Dikerjakan' },
                { value: 'parts_needed', label: 'Menunggu Suku Cadang' },
                { value: 'quality_check', label: 'Pemeriksaan Kualitas' },
                { value: 'completed', label: 'Selesai' },
                { value: 'rejected', label: 'Ditolak' },
              ]}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />

            <Select
              label="Tugaskan Mekanik"
              options={[
                { value: '', label: 'Belum Ditugaskan' },
                ...mechanics.map(m => ({ value: m.id, label: m.full_name })),
              ]}
              value={editForm.assignedMechanicId}
              onChange={(e) => setEditForm({ ...editForm, assignedMechanicId: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Perkiraan Biaya"
                placeholder="0.00"
                value={editForm.estimatedCost}
                onChange={(e) => setEditForm({ ...editForm, estimatedCost: e.target.value })}
                step="0.01"
              />

              <Input
                type="number"
                label="Biaya Akhir"
                placeholder="0.00"
                value={editForm.finalCost}
                onChange={(e) => setEditForm({ ...editForm, finalCost: e.target.value })}
                step="0.01"
              />
            </div>

            <TextArea
              label="Catatan Admin"
              placeholder="Tambahkan catatan..."
              value={editForm.adminNotes}
              onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
              rows={3}
            />

            <div className="flex space-x-4 pt-4">
              <Button onClick={handleUpdate}>Perbarui Permintaan</Button>
              <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
