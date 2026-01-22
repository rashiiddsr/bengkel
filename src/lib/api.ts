import type { Profile, ServiceRequest, Vehicle, StatusHistory, ServiceProgress, ServicePhoto } from './database.types';

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

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const data = await response.json();
      return data?.message ?? JSON.stringify(data);
    } catch (error) {
      return (error as Error).message || 'Permintaan gagal';
    }
  }
  const text = await response.text();
  if (!text) return 'Permintaan gagal';
  try {
    const parsed = JSON.parse(text);
    return parsed?.message ?? text;
  } catch {
    return text;
  }
};

const uploadFile = async (path: string, formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<{ path: string }>;
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: Profile['role'] | 'superadmin';
};

export type UserAccount = AuthUser & {
  is_active: boolean;
};

export type UserProfile = Profile & {
  email: string | null;
  username: string | null;
  is_active: boolean;
};

export type ServiceRequestWithRelations = ServiceRequest & {
  customer?: Profile;
  mechanic?: Profile | null;
  vehicle?: Vehicle | null;
};

export const api = {
  getSession: () => apiFetch<{ user: AuthUser | null; profile: Profile | null }>('/auth/session'),
  login: (identifier: string, password: string) =>
    apiFetch<{ user: AuthUser; profile: Profile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  register: (payload: {
    email: string;
    username: string;
    password: string;
    full_name: string;
    phone: string;
    address?: string | null;
  }) =>
    apiFetch<{ user: AuthUser; profile: Profile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
  listProfiles: (params?: QueryParams) => apiFetch<UserProfile[]>(`/profiles${buildQuery(params)}`),
  updateProfile: (profileId: string, payload: Partial<Profile>) =>
    apiFetch<Profile>(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateUser: (userId: string, payload: { email?: string; username?: string; password?: string; is_active?: boolean }) =>
    apiFetch<UserAccount>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createMechanic: (payload: {
    email: string;
    username: string;
    password: string;
    full_name: string;
    phone?: string | null;
    address?: string | null;
  }) =>
    apiFetch<Profile>('/mechanics', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
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
  listServiceProgress: (params?: QueryParams) =>
    apiFetch<ServiceProgress[]>(`/service-progress${buildQuery(params)}`),
  listServicePhotos: (params?: QueryParams) =>
    apiFetch<ServicePhoto[]>(`/service-photos${buildQuery(params)}`),
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
  createServiceProgress: (payload: {
    service_request_id: string;
    progress_date: string;
    description: string;
    created_by: string;
  }) =>
    apiFetch<ServiceProgress>('/service-progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createServicePhoto: (payload: {
    service_request_id: string;
    service_progress_id?: string | null;
    photo_url: string;
    description?: string | null;
    uploaded_by: string;
  }) =>
    apiFetch<ServicePhoto>('/service-photos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const data = await uploadFile('/uploads', formData);
    return data.path;
  },
};

export const resolveImageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};
