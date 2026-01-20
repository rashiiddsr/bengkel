import type { ServiceRequest } from './database.types';

export const STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  in_progress: 'Sedang Dikerjakan',
  parts_needed: 'Menunggu Suku Cadang',
  quality_check: 'Pemeriksaan Kualitas',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

export const formatStatus = (status: ServiceRequest['status']) => STATUS_LABELS[status] ?? status;

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount);

export const formatDate = (value: string | Date) => new Date(value).toLocaleDateString('id-ID');

export const formatDateTime = (value: string | Date) => new Date(value).toLocaleString('id-ID');
