CREATE DATABASE IF NOT EXISTS bengkel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bengkel;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'mechanic', 'customer') NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'mechanic', 'customer') NOT NULL DEFAULT 'customer',
  phone VARCHAR(30),
  address TEXT,
  avatar_url TEXT,
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

CREATE TABLE service_types (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE service_requests (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  service_type VARCHAR(120) NOT NULL,
  description TEXT,
  preferred_date DATE,
  status ENUM('pending', 'approved', 'in_progress', 'awaiting_payment', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
  assigned_mechanic_id CHAR(36),
  estimated_cost DECIMAL(12, 2),
  down_payment DECIMAL(12, 2),
  total_cost DECIMAL(12, 2),
  payment_method ENUM('cash', 'non_cash'),
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

CREATE TABLE service_progress (
  id CHAR(36) PRIMARY KEY,
  service_request_id CHAR(36) NOT NULL,
  progress_date DATE NOT NULL,
  description TEXT NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_progress_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_progress_user FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE service_photos (
  id CHAR(36) PRIMARY KEY,
  service_request_id CHAR(36) NOT NULL,
  service_progress_id CHAR(36),
  photo_url TEXT NOT NULL,
  description TEXT,
  uploaded_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_photos_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_photos_progress FOREIGN KEY (service_progress_id) REFERENCES service_progress(id) ON DELETE SET NULL,
  CONSTRAINT fk_service_photos_user FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  recipient_id CHAR(36) NOT NULL,
  actor_id CHAR(36),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT,
  entity_type VARCHAR(80),
  entity_id CHAR(36),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL
);

SET @admin_id = UUID();
SET @mechanic_id = UUID();
SET @customer_id = UUID();

INSERT INTO users (id, username, email, password_hash, role)
VALUES
  (@admin_id, 'admin', 'admin@gmail.com', SHA2('admin', 256), 'admin'),
  (@mechanic_id, 'mechanic', 'mechanic@gmail.com', SHA2('mechanic', 256), 'mechanic'),
  (@customer_id, 'customer', 'customer@gmail.com', SHA2('customer', 256), 'customer');

INSERT INTO profiles (id, full_name, role)
VALUES
  (@admin_id, 'Admin', 'admin'),
  (@mechanic_id, 'Mekanik', 'mechanic'),
  (@customer_id, 'Customer', 'customer');

INSERT INTO service_types (id, name, description)
VALUES
  (UUID(), 'Overhaul Mesin', 'Perbaikan menyeluruh pada komponen mesin utama.'),
  (UUID(), 'Overhaul Transmisi Otomatis', 'Perawatan dan perbaikan sistem transmisi otomatis.'),
  (UUID(), 'Overhaul Transmisi Manual', 'Perbaikan dan penyetelan transmisi manual.'),
  (UUID(), 'Sistem Suspensi', 'Diagnosa serta perbaikan sistem suspensi kendaraan.'),
  (UUID(), 'Kelistrikan', 'Perbaikan dan pengecekan sistem kelistrikan kendaraan.'),
  (UUID(), 'Servis ECU', 'Diagnosa dan pemeliharaan ECU kendaraan.'),
  (UUID(), 'Sistem ABS', 'Pemeriksaan serta servis sistem pengereman ABS.'),
  (UUID(), 'Central Lock', 'Perbaikan modul central lock kendaraan.'),
  (UUID(), 'Pemasangan ECU Racing', 'Instalasi ECU racing untuk performa optimal.'),
  (UUID(), 'Perbaikan Cat & Bodi', 'Perbaikan bodi dan pengecatan kendaraan.'),
  (UUID(), 'Inspeksi Kendaraan', 'Pemeriksaan menyeluruh kondisi kendaraan.');
