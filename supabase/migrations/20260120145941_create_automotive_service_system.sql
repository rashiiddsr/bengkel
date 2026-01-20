/*
  # Automotive Service Management System Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (text: 'admin', 'mechanic', 'customer')
      - `phone` (text)
      - `address` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `vehicles`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references profiles)
      - `make` (text)
      - `model` (text)
      - `year` (integer)
      - `license_plate` (text, unique)
      - `created_at` (timestamptz)
    
    - `service_requests`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references profiles)
      - `vehicle_id` (uuid, references vehicles)
      - `service_type` (text)
      - `description` (text)
      - `preferred_date` (date)
      - `status` (text: 'pending', 'approved', 'in_progress', 'parts_needed', 'quality_check', 'completed', 'rejected')
      - `assigned_mechanic_id` (uuid, references profiles, nullable)
      - `estimated_cost` (numeric)
      - `final_cost` (numeric)
      - `admin_notes` (text)
      - `mechanic_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `status_history`
      - `id` (uuid, primary key)
      - `service_request_id` (uuid, references service_requests)
      - `status` (text)
      - `notes` (text)
      - `changed_by` (uuid, references profiles)
      - `created_at` (timestamptz)
    
    - `service_photos`
      - `id` (uuid, primary key)
      - `service_request_id` (uuid, references service_requests)
      - `photo_url` (text)
      - `description` (text)
      - `uploaded_by` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Admins can access all data
    - Mechanics can access assigned service requests
    - Customers can only access their own data

  3. Important Notes
    - Uses auth.uid() for authentication checks
    - Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
    - Role-based access control via profiles.role
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'mechanic', 'customer')),
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  license_plate text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  description text,
  preferred_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'parts_needed', 'quality_check', 'completed', 'rejected')),
  assigned_mechanic_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  estimated_cost numeric(10, 2),
  final_cost numeric(10, 2),
  admin_notes text,
  mechanic_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create status_history table
CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  changed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create service_photos table
CREATE TABLE IF NOT EXISTS service_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  description text,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_photos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "New users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Vehicles policies
CREATE POLICY "Customers can view own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Admins and mechanics can view all vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'mechanic')
    )
  );

CREATE POLICY "Customers can insert own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can manage all vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service requests policies
CREATE POLICY "Customers can view own service requests"
  ON service_requests FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Mechanics can view assigned service requests"
  ON service_requests FOR SELECT
  TO authenticated
  USING (
    assigned_mechanic_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'mechanic'
    )
  );

CREATE POLICY "Admins can view all service requests"
  ON service_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can create service requests"
  ON service_requests FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can update all service requests"
  ON service_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Mechanics can update assigned service requests"
  ON service_requests FOR UPDATE
  TO authenticated
  USING (assigned_mechanic_id = auth.uid())
  WITH CHECK (assigned_mechanic_id = auth.uid());

CREATE POLICY "Customers can update own pending requests"
  ON service_requests FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid() AND status = 'pending')
  WITH CHECK (customer_id = auth.uid() AND status = 'pending');

-- Status history policies
CREATE POLICY "Users can view status history for accessible requests"
  ON status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_requests
      WHERE service_requests.id = status_history.service_request_id
      AND (
        service_requests.customer_id = auth.uid()
        OR service_requests.assigned_mechanic_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create status history"
  ON status_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Service photos policies
CREATE POLICY "Users can view photos for accessible requests"
  ON service_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_requests
      WHERE service_requests.id = service_photos.service_request_id
      AND (
        service_requests.customer_id = auth.uid()
        OR service_requests.assigned_mechanic_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Mechanics and admins can upload photos"
  ON service_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'mechanic')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_mechanic_id ON service_requests(assigned_mechanic_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_status_history_service_request_id ON status_history(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_photos_service_request_id ON service_photos(service_request_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();