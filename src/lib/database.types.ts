export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'superadmin' | 'admin' | 'mechanic' | 'customer'
          phone: string | null
          address: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'superadmin' | 'admin' | 'mechanic' | 'customer'
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'superadmin' | 'admin' | 'mechanic' | 'customer'
          phone?: string | null
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          customer_id: string
          make: string
          model: string
          year: number
          license_plate: string
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          make: string
          model: string
          year: number
          license_plate: string
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          make?: string
          model?: string
          year?: number
          license_plate?: string
          photo_url?: string | null
          created_at?: string
        }
      }
      service_types: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          customer_id: string
          vehicle_id: string
          service_type: string
          description: string | null
          preferred_date: string | null
          status: 'pending' | 'approved' | 'in_progress' | 'awaiting_payment' | 'completed' | 'rejected'
          assigned_mechanic_id: string | null
          estimated_cost: number | null
          down_payment: number | null
          total_cost: number | null
          payment_method: 'cash' | 'non_cash' | null
          admin_notes: string | null
          mechanic_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          vehicle_id: string
          service_type: string
          description?: string | null
          preferred_date?: string | null
          status?: 'pending' | 'approved' | 'in_progress' | 'awaiting_payment' | 'completed' | 'rejected'
          assigned_mechanic_id?: string | null
          estimated_cost?: number | null
          down_payment?: number | null
          total_cost?: number | null
          payment_method?: 'cash' | 'non_cash' | null
          admin_notes?: string | null
          mechanic_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          vehicle_id?: string
          service_type?: string
          description?: string | null
          preferred_date?: string | null
          status?: 'pending' | 'approved' | 'in_progress' | 'awaiting_payment' | 'completed' | 'rejected'
          assigned_mechanic_id?: string | null
          estimated_cost?: number | null
          down_payment?: number | null
          total_cost?: number | null
          payment_method?: 'cash' | 'non_cash' | null
          admin_notes?: string | null
          mechanic_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      status_history: {
        Row: {
          id: string
          service_request_id: string
          status: string
          notes: string | null
          changed_by: string
          created_at: string
        }
        Insert: {
          id?: string
          service_request_id: string
          status: string
          notes?: string | null
          changed_by: string
          created_at?: string
        }
        Update: {
          id?: string
          service_request_id?: string
          status?: string
          notes?: string | null
          changed_by?: string
          created_at?: string
        }
      }
      service_progress: {
        Row: {
          id: string
          service_request_id: string
          progress_date: string
          description: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          service_request_id: string
          progress_date: string
          description: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          service_request_id?: string
          progress_date?: string
          description?: string
          created_by?: string
          created_at?: string
        }
      }
      service_photos: {
        Row: {
          id: string
          service_request_id: string
          service_progress_id: string | null
          photo_url: string
          description: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          service_request_id: string
          service_progress_id?: string | null
          photo_url: string
          description?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          service_request_id?: string
          service_progress_id?: string | null
          photo_url?: string
          description?: string | null
          uploaded_by?: string
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type ServiceType = Database['public']['Tables']['service_types']['Row'];
export type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
export type StatusHistory = Database['public']['Tables']['status_history']['Row'];
export type ServiceProgress = Database['public']['Tables']['service_progress']['Row'];
export type ServicePhoto = Database['public']['Tables']['service_photos']['Row'];
