import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, MapPin, Package } from 'lucide-react';
import { Card } from '../../components/ui';
import { Header, PageContainer } from '../../components/layout';
import { useCompletionMetrics, useCompletions, useLocations } from '../../hooks';
import { MANAGER_AUTH_KEY, CATEGORIES } from '../../lib/constants';
import { getStorageItem } from '../../lib/utils';
import { subDays } from 'date-fns';

export default function Metrics() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { sevenDayStats, thirtyDayStats, loading: metricsLoading } = useCompletionMetrics();
  const { locations } = useLocations();
  const { completions, loading: completionsLoading } = useCompletions({
    startDate: subDays(new Date(), 30),
  });

  useEffect(() => {
    const auth = getStorageItem<{ authenticated: boolean }>(MANAGER_AUTH_KEY);
    if (!auth?.authenticated) {
      navigate('/manager');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  // Calculate category breakdown
  const categoryBreakdown = CATEGORIES.map((cat) => {
    const count = completions
      .filter((c) => c.category === cat)
      .reduce((sum, c) => sum + c.quantity_completed, 0);
    return { category: cat, count };
  }).sort((a, b) => b.count - a.count);

  const totalCompletions = categoryBreakdown.reduce((sum, c) => sum + c.count, 0);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header variant="manager" />

      <PageContainer maxWidth="full">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            CAPACITY METRICS
          </h1>
          <p className="text-gray-600 mt-1">
            Track completion rates and capacity across locations
          </p>
        </div>

        {/* 7-Day Completions */}
        <div className="mb-8">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gc-red" />
            7-Day Completions by Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricsLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded" />
                  </Card>
                ))
            ) : (
              sevenDayStats.map((stat) => (
                <LocationMetricCard
                  key={stat.locationId}
                  city={stat.city}
                  storeNumber={stat.storeNumber}
                  count={stat.count}
                  period="7 days"
                />
              ))
            )}
          </div>
        </div>

        {/* 30-Day Completions */}
        <div className="mb-8">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gc-red" />
            30-Day Completions by Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricsLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded" />
                  </Card>
                ))
            ) : (
              thirtyDayStats.map((stat) => (
                <LocationMetricCard
                  key={stat.locationId}
                  city={stat.city}
                  storeNumber={stat.storeNumber}
                  count={stat.count}
                  period="30 days"
                />
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gc-red" />
            30-Day Completions by Category
          </h2>
          <Card>
            {completionsLoading ? (
              <div className="animate-pulse space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded" />
                  ))}
              </div>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((item) => {
                  const percentage = totalCompletions > 0 ? (item.count / totalCompletions) * 100 : 0;
                  return (
                    <div key={item.category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">{item.category}</span>
                        <span className="text-gray-600">
                          {item.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gc-red h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gc-red text-lg">{totalCompletions}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Location Summary Table */}
        <div>
          <h2 className="text-lg font-heading font-semibold text-gray-900 mb-4">
            Location Summary
          </h2>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Store #
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      7-Day Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      30-Day Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Daily Avg (30d)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metricsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-gc-red border-t-transparent rounded-full mx-auto" />
                      </td>
                    </tr>
                  ) : (
                    locations.map((loc) => {
                      const sevenDay = sevenDayStats.find((s) => s.locationId === loc.id);
                      const thirtyDay = thirtyDayStats.find((s) => s.locationId === loc.id);
                      const dailyAvg = thirtyDay ? (thirtyDay.count / 30).toFixed(1) : '0';

                      return (
                        <tr key={loc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                            {loc.city}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {loc.store_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-semibold">
                            {sevenDay?.count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-semibold">
                            {thirtyDay?.count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                            {dailyAvg}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}

interface LocationMetricCardProps {
  city: string;
  storeNumber: string;
  count: number;
  period: string;
}

function LocationMetricCard({ city, storeNumber, count, period }: LocationMetricCardProps) {
  return (
    <Card className="border-l-4 border-l-gc-red">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{storeNumber}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{city}</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gc-red">{count}</p>
          <p className="text-xs text-gray-500">Last {period}</p>
        </div>
      </div>
    </Card>
  );
}
