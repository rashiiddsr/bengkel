CREATE DATABASE IF NOT EXISTS bengkel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bengkel;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'mechanic', 'customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'mechanic', 'customer') NOT NULL DEFAULT 'customer',
  phone VARCHAR(30),
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE vehicles (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  license_plate VARCHAR(32) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE service_requests (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  service_type VARCHAR(120) NOT NULL,
  description TEXT,
  preferred_date DATE,
  status ENUM('pending', 'approved', 'in_progress', 'parts_needed', 'quality_check', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
  assigned_mechanic_id CHAR(36),
  estimated_cost DECIMAL(12, 2),
  final_cost DECIMAL(12, 2),
  admin_notes TEXT,
  mechanic_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_requests_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_requests_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_requests_mechanic FOREIGN KEY (assigned_mechanic_id) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE status_history (
  id CHAR(36) PRIMARY KEY,
  service_request_id CHAR(36) NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_history_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE service_photos (
  id CHAR(36) PRIMARY KEY,
  service_request_id CHAR(36) NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT,
  uploaded_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_photos_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_photos_user FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE
);

SET @superadmin_id = UUID();
SET @admin_id = UUID();
SET @mechanic_id = UUID();

INSERT INTO users (id, email, password_hash, role)
VALUES
  (@superadmin_id, 'superadmin@gmail.com', SHA2('superadmin', 256), 'superadmin'),
  (@admin_id, 'admin@gmail.com', SHA2('admin', 256), 'admin'),
  (@mechanic_id, 'mechanik@gmail.com', SHA2('mekanik', 256), 'mechanic');

INSERT INTO profiles (id, full_name, role)
VALUES
  (@superadmin_id, 'Superadmin', 'superadmin'),
  (@admin_id, 'Admin', 'admin'),
  (@mechanic_id, 'Mekanik Default', 'mechanic');
