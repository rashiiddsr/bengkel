import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, BarChart3, Users, Wrench, Car, Wallet } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { api, type ServiceRequestWithRelations, type UserProfile } from '../../lib/api';
import type { ServiceRequest, ServiceType, Vehicle } from '../../lib/database.types';
import { formatCurrency, formatDate, formatStatus } from '../../lib/format';

const statusOrder: ServiceRequest['status'][] = [
  'pending',
  'approved',
  'in_progress',
  'awaiting_payment',
  'completed',
  'rejected',
];

const defaultStartDate = () => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return firstDay.toISOString().split('T')[0];
};

const todayDate = () => new Date().toISOString().split('T')[0];

const getRangeLabel = (startDate: string, endDate: string) => {
  if (!startDate && !endDate) return 'Sepanjang waktu';
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) return `Mulai ${formatDate(startDate)}`;
  return `Hingga ${formatDate(endDate)}`;
};

const toDateBoundary = (value: string, isEnd = false) => {
  const date = new Date(value);
  if (isEnd) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

const countBy = <T,>(items: T[], getKey: (item: T) => string) => {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
};

const sumBy = <T,>(items: T[], getValue: (item: T) => number) =>
  items.reduce((acc, item) => acc + getValue(item), 0);

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

export function Reports() {
  const [requests, setRequests] = useState<ServiceRequestWithRelations[]>([]);
  const [mechanics, setMechanics] = useState<UserProfile[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(todayDate);

  useEffect(() => {
    const fetchReportData = async () => {
      const [serviceRequests, mechanicProfiles, customerProfiles, vehicleData, serviceTypeData] =
        await Promise.all([
          api.listServiceRequests({ include: 'customer,vehicle', order: 'created_at.desc' }),
          api.listProfiles({ role: 'mechanic', order: 'full_name.asc' }),
          api.listProfiles({ role: 'customer', order: 'full_name.asc' }),
          api.listVehicles({ order: 'created_at.desc' }),
          api.listServiceTypes({ order: 'name.asc' }),
        ]);

      setRequests(serviceRequests ?? []);
      setMechanics(mechanicProfiles ?? []);
      setCustomers(customerProfiles ?? []);
      setVehicles(vehicleData ?? []);
      setServiceTypes(serviceTypeData ?? []);
      setLoading(false);
    };

    fetchReportData();
  }, []);

  const filteredRequests = useMemo(() => {
    const start = startDate ? toDateBoundary(startDate) : null;
    const end = endDate ? toDateBoundary(endDate, true) : null;
    return requests.filter((request) => {
      if (!start && !end) return true;
      const createdAt = new Date(request.created_at);
      if (start && createdAt < start) return false;
      if (end && createdAt > end) return false;
      return true;
    });
  }, [requests, startDate, endDate]);

  const statusSummary = useMemo(() => {
    const counts = countBy(filteredRequests, (request) => request.status);
    return statusOrder.map((status) => ({
      status,
      label: formatStatus(status),
      value: counts[status] ?? 0,
    }));
  }, [filteredRequests]);

  const totalRequests = filteredRequests.length;
  const completedCount = statusSummary.find((item) => item.status === 'completed')?.value ?? 0;
  const rejectionCount = statusSummary.find((item) => item.status === 'rejected')?.value ?? 0;
  const completionRate = totalRequests ? (completedCount / totalRequests) * 100 : 0;
  const rejectionRate = totalRequests ? (rejectionCount / totalRequests) * 100 : 0;

  const serviceTypeSummary = useMemo(() => {
    const counts = countBy(filteredRequests, (request) => request.service_type || 'Tidak diketahui');
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredRequests]);

  const mechanicSummary = useMemo(() => {
    const assignments = countBy(filteredRequests, (request) => request.assigned_mechanic_id ?? 'unassigned');
    const completedByMechanic = countBy(
      filteredRequests.filter((request) => request.status === 'completed'),
      (request) => request.assigned_mechanic_id ?? 'unassigned'
    );

    return mechanics.map((mechanic) => {
      const total = assignments[mechanic.id] ?? 0;
      const completed = completedByMechanic[mechanic.id] ?? 0;
      const progress = total ? (completed / total) * 100 : 0;
      return {
        id: mechanic.id,
        name: mechanic.full_name,
        total,
        completed,
        progress,
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredRequests, mechanics]);

  const customerSummary = useMemo(() => {
    const activeCustomers = new Set(filteredRequests.map((request) => request.customer_id));
    const newCustomers = customers.filter((customer) => {
      if (!startDate && !endDate) return true;
      const createdAt = new Date(customer.created_at);
      const start = startDate ? toDateBoundary(startDate) : null;
      const end = endDate ? toDateBoundary(endDate, true) : null;
      if (start && createdAt < start) return false;
      if (end && createdAt > end) return false;
      return true;
    });

    const customerRequestCounts = countBy(filteredRequests, (request) => request.customer_id);
    const topCustomers = Object.entries(customerRequestCounts)
      .map(([id, count]) => {
        const profile = customers.find((customer) => customer.id === id);
        return { id, count, name: profile?.full_name ?? 'Pelanggan Tidak Dikenal' };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      activeCount: activeCustomers.size,
      newCount: newCustomers.length,
      topCustomers,
    };
  }, [customers, filteredRequests, startDate, endDate]);

  const vehicleSummary = useMemo(() => {
    const activeVehicles = new Set(filteredRequests.map((request) => request.vehicle_id));
    return {
      totalVehicles: vehicles.length,
      activeVehicles: activeVehicles.size,
    };
  }, [filteredRequests, vehicles]);

  const paymentSummary = useMemo(() => {
    const totalCost = sumBy(filteredRequests, (request) => request.total_cost ?? 0);
    const completedCost = sumBy(
      filteredRequests.filter((request) => request.status === 'completed'),
      (request) => request.total_cost ?? 0
    );
    const outstandingCost = sumBy(
      filteredRequests.filter((request) => request.status === 'awaiting_payment'),
      (request) => request.total_cost ?? 0
    );
    const cashCount = filteredRequests.filter((request) => request.payment_method === 'cash').length;
    const nonCashCount = filteredRequests.filter((request) => request.payment_method === 'non_cash').length;

    return {
      totalCost,
      completedCost,
      outstandingCost,
      cashCount,
      nonCashCount,
      averageTicket: totalRequests ? totalCost / totalRequests : 0,
    };
  }, [filteredRequests, totalRequests]);

  const operationalNotes = [
    'Gunakan laporan ini untuk memantau arus permintaan servis, kapasitas mekanik, dan performa layanan.',
    'Cocokkan status permintaan untuk memastikan tidak ada pekerjaan tertahan terlalu lama.',
    'Evaluasi layanan populer agar stok suku cadang dan jadwal mekanik tetap efisien.',
  ];

  const rangeLabel = getRangeLabel(startDate, endDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Laporan Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analisis menyeluruh sistem BM AutoService berdasarkan data operasional {rangeLabel.toLowerCase()}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <ClipboardList className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Analisis Sistem</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Sistem ini menghubungkan pelanggan, admin, dan mekanik dalam satu alur kerja servis.
            Admin mengelola jenis layanan, pelanggan, dan distribusi pekerjaan mekanik.
            Laporan berikut menyajikan ringkasan performa layanan, utilisasi mekanik, hingga pendapatan.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {operationalNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat laporan...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Permintaan</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalRequests}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{rangeLabel}</p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-blue-500" />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tingkat Selesai</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatPercentage(completionRate)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{completedCount} pekerjaan</p>
                  </div>
                  <ClipboardList className="h-10 w-10 text-green-500" />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tingkat Penolakan</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {formatPercentage(rejectionRate)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{rejectionCount} permintaan</p>
                  </div>
                  <ClipboardList className="h-10 w-10 text-red-500" />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Tiket</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(paymentSummary.averageTicket)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Per permintaan servis</p>
                  </div>
                  <Wallet className="h-10 w-10 text-purple-500" />
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribusi Status Permintaan</h3>
              </div>
              <CardBody className="space-y-3">
                {statusSummary.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.status}</p>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold">{item.value}</span>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ringkasan Layanan</h3>
              </div>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Jenis Layanan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{serviceTypes.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Layanan Aktif</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {serviceTypes.filter((service) => service.is_active).length}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Top Layanan</p>
                  {serviceTypeSummary.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada data layanan.</p>
                  ) : (
                    <ul className="space-y-2">
                      {serviceTypeSummary.map((service) => (
                        <li key={service.name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{service.name}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{service.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Users className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Pelanggan</h3>
                </div>
              </div>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Pelanggan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{customers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Pelanggan Aktif</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{customerSummary.activeCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Pelanggan Baru</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{customerSummary.newCount}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Top Pelanggan</p>
                  {customerSummary.topCustomers.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada data pelanggan.</p>
                  ) : (
                    <ul className="space-y-2">
                      {customerSummary.topCustomers.map((customer) => (
                        <li key={customer.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{customer.name}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{customer.count}x</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Wrench className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Kinerja Mekanik</h3>
                </div>
              </div>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Mekanik</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{mechanics.length}</span>
                </div>
                <div className="space-y-2">
                  {mechanicSummary.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada data mekanik.</p>
                  ) : (
                    <ul className="space-y-2">
                      {mechanicSummary.slice(0, 5).map((mechanic) => (
                        <li key={mechanic.id} className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 dark:text-gray-200">{mechanic.name}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{mechanic.total}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {mechanic.completed} selesai • {formatPercentage(mechanic.progress)} sukses
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Car className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Kendaraan</h3>
                </div>
              </div>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Kendaraan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{vehicleSummary.totalVehicles}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Kendaraan Aktif</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{vehicleSummary.activeVehicles}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kendaraan aktif dihitung dari permintaan servis pada periode laporan.
                </p>
              </CardBody>
            </Card>
          </div>

          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Wallet className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Ringkasan Keuangan</h3>
              </div>
            </div>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Nilai Servis</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(paymentSummary.totalCost)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nilai Servis Selesai</p>
                  <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(paymentSummary.completedCost)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Menunggu Pembayaran</p>
                  <p className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(paymentSummary.outstandingCost)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pembayaran Tunai</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {paymentSummary.cashCount} transaksi
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pembayaran Non Tunai</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {paymentSummary.nonCashCount} transaksi
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-600 dark:text-gray-300">
                Nilai servis dihitung dari total biaya pada setiap permintaan. Pastikan nominal biaya selalu diperbarui
                setelah mekanik menyelesaikan pekerjaan agar laporan keuangan akurat.
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Permintaan Terbaru</h3>
            </div>
            <CardBody>
              {filteredRequests.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada permintaan servis pada periode ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Tanggal</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Pelanggan</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Layanan</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Total Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredRequests.slice(0, 8).map((request) => (
                        <tr key={request.id}>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {request.customer?.full_name ?? 'Tidak diketahui'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{request.service_type}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                              {formatStatus(request.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {request.total_cost ? formatCurrency(request.total_cost) : 'Belum ditentukan'}
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
      )}
    </div>
  );
}
