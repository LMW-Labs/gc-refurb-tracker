import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, TrendingUp, Search, X, Eye } from 'lucide-react';
import { Card, Select, Input, Button, Modal } from '../../components/ui';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '../../components/ui/Table';
import { Header, PageContainer } from '../../components/layout';
import { StatusBadge, PriorityBadge } from '../../components/shared';
import { useRequests, useRequestStats, useLocations, useRealtimeRequests } from '../../hooks';
import { MANAGER_AUTH_KEY, STATUSES, CATEGORIES } from '../../lib/constants';
import { getStorageItem, formatRequestNumber, formatRelativeTime } from '../../lib/utils';
import type { RefurbRequest, Status, Category } from '../../types';
import StatusUpdateForm from '../../components/forms/StatusUpdateForm';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filters
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected request for detail view
  const [selectedRequest, setSelectedRequest] = useState<RefurbRequest | null>(null);

  const { locations } = useLocations();
  const { stats, loading: statsLoading } = useRequestStats();
  const { requests, loading: requestsLoading, refetch, updateStatus } = useRequests({
    locationId: locationFilter || undefined,
    status: (statusFilter as Status) || undefined,
    category: (categoryFilter as Category) || undefined,
  });

  // Real-time updates
  useRealtimeRequests(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    const auth = getStorageItem<{ authenticated: boolean }>(MANAGER_AUTH_KEY);
    if (!auth?.authenticated) {
      navigate('/manager');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  // Filter requests by search term
  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      formatRequestNumber(req.request_number).toLowerCase().includes(term) ||
      req.instrument_type.toLowerCase().includes(term) ||
      req.brand.toLowerCase().includes(term) ||
      req.technician?.name.toLowerCase().includes(term) ||
      req.location?.city.toLowerCase().includes(term)
    );
  });

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map((loc) => ({
      value: loc.id,
      label: `${loc.city} (${loc.store_number})`,
    })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...STATUSES.map((s) => ({ value: s, label: s })),
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: Status,
    fulfillmentData?: {
      quantity_fulfilled?: number;
      fulfilled_by?: string;
      fulfillment_notes?: string;
    }
  ) => {
    await updateStatus(requestId, newStatus, fulfillmentData);
    setSelectedRequest(null);
  };

  const clearFilters = () => {
    setLocationFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setSearchTerm('');
  };

  const hasFilters = locationFilter || statusFilter || categoryFilter || searchTerm;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header variant="manager" />

      <PageContainer maxWidth="full">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={<Clock className="w-6 h-6" />}
            color="amber"
            loading={statsLoading}
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
            loading={statsLoading}
          />
          <StatsCard
            title="Fulfilled Today"
            value={stats.fulfilledToday}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
            loading={statsLoading}
          />
          <StatsCard
            title="Urgent"
            value={stats.urgent}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
            loading={statsLoading}
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by request #, instrument, tech name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                options={locationOptions}
                className="w-40"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                className="w-36"
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categoryOptions}
                className="w-36"
              />
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-1">
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Requests Table */}
        <Card padding="none">
          {requestsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-gc-red border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No requests found</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>REQ #</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Tech</TableHeader>
                  <TableHeader>Instrument</TableHeader>
                  <TableHeader>Qty</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Requested</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <span className="font-semibold text-gc-red">
                        {formatRequestNumber(request.request_number)}
                      </span>
                    </TableCell>
                    <TableCell>{request.location?.city || '-'}</TableCell>
                    <TableCell>{request.technician?.name || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.instrument_type}</p>
                        <p className="text-xs text-gray-500">{request.brand}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{request.quantity_requested}</span>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={request.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-500">{formatRelativeTime(request.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Request Count */}
        <p className="text-sm text-gray-500 mt-4 text-center">
          Showing {filteredRequests.length} of {requests.length} requests
        </p>
      </PageContainer>

      {/* Request Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest ? formatRequestNumber(selectedRequest.request_number) : ''}
        size="lg"
      >
        {selectedRequest && (
          <StatusUpdateForm
            request={selectedRequest}
            onUpdate={handleStatusUpdate}
            onCancel={() => setSelectedRequest(null)}
          />
        )}
      </Modal>
    </>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'amber' | 'blue' | 'green' | 'red';
  loading?: boolean;
}

function StatsCard({ title, value, icon, color, loading }: StatsCardProps) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <Card className={`${colors[color]} border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          {loading ? (
            <div className="h-8 w-12 bg-current opacity-20 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
        </div>
        <div className="opacity-60">{icon}</div>
      </div>
    </Card>
  );
}
