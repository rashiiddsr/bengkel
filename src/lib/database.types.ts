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
          role: 'admin' | 'mechanic' | 'customer'
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'admin' | 'mechanic' | 'customer'
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'mechanic' | 'customer'
          phone?: string | null
          address?: string | null
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
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          make: string
          model: string
          year: number
          license_plate: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          make?: string
          model?: string
          year?: number
          license_plate?: string
          created_at?: string
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
          status: 'pending' | 'approved' | 'in_progress' | 'parts_needed' | 'quality_check' | 'completed' | 'rejected'
          assigned_mechanic_id: string | null
          estimated_cost: number | null
          final_cost: number | null
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
          status?: 'pending' | 'approved' | 'in_progress' | 'parts_needed' | 'quality_check' | 'completed' | 'rejected'
          assigned_mechanic_id?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
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
          status?: 'pending' | 'approved' | 'in_progress' | 'parts_needed' | 'quality_check' | 'completed' | 'rejected'
          assigned_mechanic_id?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
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
      service_photos: {
        Row: {
          id: string
          service_request_id: string
          photo_url: string
          description: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          service_request_id: string
          photo_url: string
          description?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          service_request_id?: string
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
export type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
export type StatusHistory = Database['public']['Tables']['status_history']['Row'];
export type ServicePhoto = Database['public']['Tables']['service_photos']['Row'];
