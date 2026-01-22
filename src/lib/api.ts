import type { Profile, ServiceRequest, Vehicle, StatusHistory } from './database.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

const buildQuery = (params?: QueryParams) => {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (filtered.length === 0) return '';
  const searchParams = new URLSearchParams(filtered.map(([key, value]) => [key, String(value)]));
  return `?${searchParams.toString()}`;
};

const apiFetch = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    let message = 'Permintaan gagal';
    if (contentType.includes('application/json')) {
      try {
        const data = await response.json();
        message = data?.message ?? JSON.stringify(data);
      } catch (error) {
        message = (error as Error).message || message;
      }
    } else {
      const text = await response.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          message = parsed?.message ?? text;
        } catch {
          message = text;
        }
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};

export type AuthUser = {
  id: string;
  email: string;
  role: Profile['role'] | 'superadmin';
};

export type ServiceRequestWithRelations = ServiceRequest & {
  customer?: Profile;
  mechanic?: Profile | null;
  vehicle?: Vehicle | null;
};

export const api = {
  getSession: () => apiFetch<{ user: AuthUser | null; profile: Profile | null }>('/auth/session'),
  login: (email: string, password: string) =>
    apiFetch<{ user: AuthUser; profile: Profile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: { email: string; password: string; full_name: string; phone: string }) =>
    apiFetch<{ user: AuthUser; profile: Profile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
  listProfiles: (params?: QueryParams) => apiFetch<Profile[]>(`/profiles${buildQuery(params)}`),
  listVehicles: (params?: QueryParams) => apiFetch<Vehicle[]>(`/vehicles${buildQuery(params)}`),
  createVehicle: (payload: {
    customer_id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    photo_url?: string | null;
  }) =>
    apiFetch<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateVehicle: (vehicleId: string, payload: Partial<Vehicle>) =>
    apiFetch<Vehicle>(`/vehicles/${vehicleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteVehicle: (vehicleId: string) =>
    apiFetch<void>(`/vehicles/${vehicleId}`, {
      method: 'DELETE',
    }),
  listServiceRequests: (params?: QueryParams) =>
    apiFetch<ServiceRequestWithRelations[]>(`/service-requests${buildQuery(params)}`),
  createServiceRequest: (payload: {
    customer_id: string;
    vehicle_id: string;
    service_type: string;
    description?: string | null;
    preferred_date?: string | null;
    status?: ServiceRequest['status'];
  }) =>
    apiFetch<ServiceRequest>('/service-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateServiceRequest: (requestId: string, payload: Partial<ServiceRequest>) =>
    apiFetch<ServiceRequest>(`/service-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listStatusHistory: (params?: QueryParams) =>
    apiFetch<StatusHistory[]>(`/status-history${buildQuery(params)}`),
  createStatusHistory: (payload: {
    service_request_id: string;
    status: string;
    notes?: string | null;
    changed_by: string;
  }) =>
    apiFetch<StatusHistory>('/status-history', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
