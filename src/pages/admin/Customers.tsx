import { useEffect, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';
import { Users } from 'lucide-react';

export function Customers() {
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [customerStats, setCustomerStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: customersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('full_name');

    if (customersData) {
      setCustomers(customersData);

      const stats: Record<string, any> = {};
      for (const customer of customersData) {
        const [requestsRes, vehiclesRes] = await Promise.all([
          supabase.from('service_requests').select('*').eq('customer_id', customer.id),
          supabase.from('vehicles').select('*').eq('customer_id', customer.id),
        ]);

        stats[customer.id] = {
          totalRequests: requestsRes.data?.length || 0,
          totalVehicles: vehiclesRes.data?.length || 0,
        };
      }
      setCustomerStats(stats);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Customers Management
      </h1>

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
          ) : customers.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No customers found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Vehicles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Total Requests
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {customer.address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {customerStats[customer.id]?.totalVehicles || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {customerStats[customer.id]?.totalRequests || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
