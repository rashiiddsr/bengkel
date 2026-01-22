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

const REFRESH_INTERVAL = 30000;

export function ServiceRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [mechanics, setMechanics] = useState<Profile[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState('');

  const [editForm, setEditForm] = useState({
    assignedMechanicId: '',
    downPayment: '',
    estimatedCost: '',
    adminNotes: '',
    mechanicNotes: '',
    totalCost: '',
    paymentMethod: '',
  });

  useEffect(() => {
    fetchData();
    const intervalId = window.setInterval(() => {
      fetchData();
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    const [requestsRes, mechanicsRes] = await Promise.all([
      api.listServiceRequests({ include: 'customer,mechanic,vehicle', order: 'created_at.desc' }),
      api.listProfiles({ role: 'mechanic', active: true, order: 'full_name.asc' }),
    ]);

    if (requestsRes) setRequests(requestsRes as RequestWithDetails[]);
    if (mechanicsRes) setMechanics(mechanicsRes);
    setLoading(false);
  };

  const handleEdit = (request: RequestWithDetails) => {
    setSelectedRequest(request);
    setActionError('');
    setEditForm({
      assignedMechanicId: request.assigned_mechanic_id || '',
      downPayment: request.down_payment?.toString() || '',
      estimatedCost: request.estimated_cost?.toString() || '',
      adminNotes: request.admin_notes || '',
      mechanicNotes: request.mechanic_notes || '',
      totalCost: request.total_cost?.toString() || '',
      paymentMethod: request.payment_method || '',
    });
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user) return;

    await api.updateServiceRequest(selectedRequest.id, { status: 'approved' });
    await api.createStatusHistory({
      service_request_id: selectedRequest.id,
      status: 'approved',
      notes: 'Permintaan disetujui',
      changed_by: user.id,
    });

    setSelectedRequest(null);
    fetchData();
  };

  const handleReject = async () => {
    if (!selectedRequest || !user) return;
    window.alert('Permintaan yang ditolak akan menjadi tampilan saja dan tidak bisa diubah lagi.');
    await api.updateServiceRequest(selectedRequest.id, { status: 'rejected' });
    await api.createStatusHistory({
      service_request_id: selectedRequest.id,
      status: 'rejected',
      notes: 'Permintaan ditolak',
      changed_by: user.id,
    });
    setSelectedRequest(null);
    fetchData();
  };

  const handleAssignMechanic = async () => {
    if (!selectedRequest || !user) return;
    if (!editForm.assignedMechanicId || !editForm.downPayment) {
      setActionError('Penugasan mekanik dan DP wajib diisi.');
      return;
    }

    const updates: any = {
      status: 'in_progress',
      assigned_mechanic_id: editForm.assignedMechanicId,
      down_payment: parseFloat(editForm.downPayment),
      admin_notes: editForm.adminNotes || null,
    };

    if (editForm.estimatedCost) {
      updates.estimated_cost = parseFloat(editForm.estimatedCost);
    }

    await api.updateServiceRequest(selectedRequest.id, updates);
    await api.createStatusHistory({
      service_request_id: selectedRequest.id,
      status: 'in_progress',
      notes: 'Mekanik ditugaskan dan servis dimulai.',
      changed_by: user.id,
    });

    setSelectedRequest(null);
    fetchData();
  };

  const handlePayment = async () => {
    if (!selectedRequest || !user) return;
    if (!editForm.totalCost || !editForm.paymentMethod) {
      setActionError('Total biaya dan metode pembayaran wajib diisi.');
      return;
    }

    const updates: any = {
      status: 'completed',
      total_cost: parseFloat(editForm.totalCost),
      mechanic_notes: editForm.mechanicNotes || null,
      payment_method: editForm.paymentMethod,
    };

    await api.updateServiceRequest(selectedRequest.id, updates);
    await api.createStatusHistory({
      service_request_id: selectedRequest.id,
      status: 'completed',
      notes: 'Pembayaran diperbarui dan servis selesai.',
      changed_by: user.id,
    });
    window.alert('Pembayaran berhasil diperbarui.');
    setSelectedRequest(null);
    fetchData();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      awaiting_payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
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

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="w-full lg:col-span-4">
          <Select
            options={[
              { value: 'all', label: 'Semua Permintaan' },
              { value: 'pending', label: 'Menunggu' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'in_progress', label: 'Sedang Dikerjakan' },
              { value: 'awaiting_payment', label: 'Menunggu Pembayaran' },
              { value: 'completed', label: 'Selesai' },
              { value: 'rejected', label: 'Ditolak' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
        <div className="w-full lg:col-span-8">
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
                        {request.total_cost
                          ? formatCurrency(request.total_cost)
                          : request.estimated_cost
                            ? `~${formatCurrency(request.estimated_cost)}`
                            : '-'}
                      </td>
                      <td className="px-4 py-4">
                        {['pending', 'approved', 'in_progress', 'awaiting_payment'].includes(request.status) ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(request)}
                            title="Kelola Permintaan"
                            aria-label="Kelola Permintaan"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Tidak ada aksi</span>
                        )}
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
        onClose={() => {
          setSelectedRequest(null);
          setActionError('');
        }}
        title={
          selectedRequest
            ? ({
              pending: 'Tinjau Permintaan Servis',
              approved: 'Penugasan Mekanik',
              in_progress: 'Detail Servis',
              awaiting_payment: 'Pembayaran Servis',
            }[selectedRequest.status] ?? 'Detail Permintaan Servis')
            : 'Detail Permintaan Servis'
        }
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
                {actionError}
              </div>
            )}
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

            {selectedRequest.status === 'pending' && (
              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleApprove}>Setujui</Button>
                <Button variant="secondary" onClick={handleReject}>
                  Tolak
                </Button>
              </div>
            )}

            {selectedRequest.status === 'approved' && (
              <>
                <Select
                  label={
                    <>
                      Tugaskan Mekanik <span className="text-red-500">*</span>
                    </>
                  }
                  options={[
                    { value: '', label: 'Pilih mekanik' },
                    ...mechanics.map(m => ({ value: m.id, label: m.full_name })),
                  ]}
                  value={editForm.assignedMechanicId}
                  onChange={(e) => setEditForm({ ...editForm, assignedMechanicId: e.target.value })}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    type="number"
                    label={
                      <>
                        Nilai DP <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="0.00"
                    value={editForm.downPayment}
                    onChange={(e) => setEditForm({ ...editForm, downPayment: e.target.value })}
                    step="0.01"
                  />

                  <Input
                    type="number"
                    label="Perkiraan Biaya"
                    placeholder="0.00"
                    value={editForm.estimatedCost}
                    onChange={(e) => setEditForm({ ...editForm, estimatedCost: e.target.value })}
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
                  <Button onClick={handleAssignMechanic}>Simpan Penugasan</Button>
                  <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
                    Batal
                  </Button>
                </div>
              </>
            )}

            {selectedRequest.status === 'in_progress' && (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-200">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pemilik</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedRequest.customer?.full_name ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mobil</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedRequest.vehicle?.make} {selectedRequest.vehicle?.model}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedRequest.vehicle?.license_plate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mekanik</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedRequest.mechanic?.full_name ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(selectedRequest.status)}`}>
                      {formatStatus(selectedRequest.status)}
                    </span>
                  </div>
                </div>

                {selectedRequest.admin_notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Catatan Admin</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedRequest.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedRequest.status === 'awaiting_payment' && (
              <>
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                  <p>Mekanik: <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.mechanic?.full_name ?? '-'}</span></p>
                </div>

                <Input
                  type="number"
                  label={
                    <>
                      Total Biaya <span className="text-red-500">*</span>
                    </>
                  }
                  placeholder="0.00"
                  value={editForm.totalCost}
                  onChange={(e) => setEditForm({ ...editForm, totalCost: e.target.value })}
                  step="0.01"
                />

                <TextArea
                  label="Catatan Mekanik"
                  placeholder="Tambahkan catatan mekanik..."
                  value={editForm.mechanicNotes}
                  onChange={(e) => setEditForm({ ...editForm, mechanicNotes: e.target.value })}
                  rows={3}
                />

                <Select
                  label={
                    <>
                      Metode Pembayaran <span className="text-red-500">*</span>
                    </>
                  }
                  options={[
                    { value: '', label: 'Pilih metode pembayaran' },
                    { value: 'cash', label: 'Tunai' },
                    { value: 'non_cash', label: 'Nontunai' },
                  ]}
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                />

                <div className="flex space-x-4 pt-4">
                  <Button onClick={handlePayment}>Perbarui Pembayaran</Button>
                  <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
                    Batal
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
