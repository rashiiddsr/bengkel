import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle } from '../../lib/database.types';
import { Plus, Car } from 'lucide-react';

export function MyVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
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
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from('vehicles')
      .insert({
        customer_id: user.id,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        license_plate: formData.licensePlate,
      });

    if (!error) {
      setShowModal(false);
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
      });
      fetchVehicles();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Vehicles
        </h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
            Loading...
          </p>
        ) : vehicles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No vehicles added yet
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Vehicle
            </Button>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardBody>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Car className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Year: {vehicle.year}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      License: {vehicle.license_plate}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Vehicle"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Make"
            placeholder="e.g., Toyota"
            value={formData.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            required
          />
          <Input
            label="Model"
            placeholder="e.g., Camry"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />
          <Input
            type="number"
            label="Year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
          <Input
            label="License Plate"
            placeholder="ABC-1234"
            value={formData.licensePlate}
            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            required
          />
          <div className="flex space-x-4 pt-4">
            <Button type="submit">Add Vehicle</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
