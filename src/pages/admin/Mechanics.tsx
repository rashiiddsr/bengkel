import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { api } from '../../lib/api';
import type { Profile } from '../../lib/database.types';
import { Wrench } from 'lucide-react';

export function Mechanics() {
  const [mechanics, setMechanics] = useState<Profile[]>([]);
  const [mechanicStats, setMechanicStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    const mechanicsData = await api.listProfiles({ role: 'mechanic', order: 'full_name.asc' });

    if (mechanicsData) {
      setMechanics(mechanicsData);

      const stats: Record<string, any> = {};
      for (const mechanic of mechanicsData) {
        const requests = await api.listServiceRequests({ assigned_mechanic_id: mechanic.id });

        stats[mechanic.id] = {
          total: requests.length || 0,
          inProgress: requests.filter(r => ['approved', 'in_progress', 'parts_needed', 'quality_check'].includes(r.status)).length || 0,
          completed: requests.filter(r => r.status === 'completed').length || 0,
        };
      }
      setMechanicStats(stats);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Kelola Mekanik
      </h1>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">Memuat...</p>
      ) : mechanics.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada mekanik
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mechanics.map((mechanic) => (
            <Card key={mechanic.id}>
              <CardBody>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {mechanic.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {mechanic.phone || 'Tidak ada nomor'}
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Pekerjaan:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {mechanicStats[mechanic.id]?.total || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Sedang Dikerjakan:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {mechanicStats[mechanic.id]?.inProgress || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Selesai:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {mechanicStats[mechanic.id]?.completed || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
