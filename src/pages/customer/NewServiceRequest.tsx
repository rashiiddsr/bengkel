import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Input, TextArea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle } from '../../lib/database.types';

const SERVICE_TYPES = [
  'Engine Overhaul',
  'Automatic Transmission Overhaul',
  'Manual Transmission Overhaul',
  'Suspension System',
  'Wiring/Electrical',
  'ECU Service',
  'ABS System',
  'Central Lock',
  'Racing ECU Installation',
  'Paint & Body Repair',
  'Vehicle Inspection',
];

export function NewServiceRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    description: '',
    preferredDate: '',
  });

  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVehicles(data);
    }
  };

  const handleAddVehicle = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        customer_id: user.id,
        ...newVehicle,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    if (data) {
      setVehicles([data, ...vehicles]);
      setFormData({ ...formData, vehicleId: data.id });
      setShowNewVehicle(false);
      setNewVehicle({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    if (!formData.vehicleId) {
      setError('Please select a vehicle');
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase
      .from('service_requests')
      .insert({
        customer_id: user.id,
        vehicle_id: formData.vehicleId,
        service_type: formData.serviceType,
        description: formData.description,
        preferred_date: formData.preferredDate || null,
        status: 'pending',
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    navigate('/customer/my-requests');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        New Service Request
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Request Details</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vehicle
              </label>
              {!showNewVehicle ? (
                <div className="space-y-2">
                  <Select
                    options={[
                      { value: '', label: 'Select a vehicle' },
                      ...vehicles.map(v => ({
                        value: v.id,
                        label: `${v.make} ${v.model} (${v.license_plate})`,
                      })),
                    ]}
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewVehicle(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Add New Vehicle
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Make"
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                      placeholder="e.g., Toyota"
                    />
                    <Input
                      label="Model"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      placeholder="e.g., Camry"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Year"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                    <Input
                      label="License Plate"
                      value={newVehicle.licensePlate}
                      onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={handleAddVehicle}
                      size="sm"
                    >
                      Add Vehicle
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNewVehicle(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Select
              label="Service Type"
              options={[
                { value: '', label: 'Select service type' },
                ...SERVICE_TYPES.map(type => ({ value: type, label: type })),
              ]}
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              required
            />

            <TextArea
              label="Description"
              placeholder="Describe the issue or service needed..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
            />

            <Input
              type="date"
              label="Preferred Service Date"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            />

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/customer')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
