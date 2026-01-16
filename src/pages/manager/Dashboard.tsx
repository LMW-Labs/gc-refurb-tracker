import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle, Truck, Package, Search, X, Eye,
  MapPin, User, Send, PackageCheck
} from 'lucide-react';
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
import { StatusBadge } from '../../components/shared';
import { useRequests, useRequestStats, useLocations, useRealtimeRequests } from '../../hooks';
import { MANAGER_AUTH_KEY, REQUEST_STATUSES, STATUS_CONFIG } from '../../lib/constants';
import { getStorageItem, formatRelativeTime, formatDate } from '../../lib/utils';
import type { RefurbRequest, RequestStatus } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filters
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected request for detail view
  const [selectedRequest, setSelectedRequest] = useState<RefurbRequest | null>(null);

  const { locations } = useLocations();
  const { stats, loading: statsLoading } = useRequestStats();
  const { requests, loading: requestsLoading, refetch, shipRequest, confirmPickup } = useRequests({
    locationId: locationFilter || undefined,
    status: (statusFilter as RequestStatus) || undefined,
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
      req.request_id?.toLowerCase().includes(term) ||
      req.instrument_type.toLowerCase().includes(term) ||
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
    ...REQUEST_STATUSES.map((s) => ({ value: s, label: s })),
  ];

  const clearFilters = () => {
    setLocationFilter('');
    setStatusFilter('');
    setSearchTerm('');
  };

  const hasFilters = locationFilter || statusFilter || searchTerm;

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
            title="New Requests"
            value={stats.requested}
            icon={<Clock className="w-6 h-6" />}
            color="amber"
            loading={statsLoading}
          />
          <StatsCard
            title="In Transit"
            value={stats.shipped}
            icon={<Truck className="w-6 h-6" />}
            color="blue"
            loading={statsLoading}
          />
          <StatsCard
            title="Being Worked"
            value={stats.inProgress}
            icon={<Package className="w-6 h-6" />}
            color="orange"
            loading={statsLoading}
          />
          <StatsCard
            title="Ready for Pickup"
            value={stats.readyForPickup}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
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
                  placeholder="Search by request ID, instrument, tech name..."
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
                className="w-44"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                className="w-40"
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
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No requests found</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Request ID</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Tech</TableHeader>
                  <TableHeader>Instrument</TableHeader>
                  <TableHeader>Qty</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Date</TableHeader>
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
                      <span className="font-mono font-semibold text-gray-800">
                        {request.request_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {request.location?.city || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-400" />
                        {request.technician?.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{request.instrument_type}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-lg">{request.quantity}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-500 text-sm">{formatRelativeTime(request.created_at)}</span>
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
        title={selectedRequest?.request_id || 'Request Details'}
        size="lg"
      >
        {selectedRequest && (
          <RequestDetailView
            request={selectedRequest}
            onShip={async (expectedDelivery) => {
              try {
                await shipRequest(selectedRequest.id, expectedDelivery);
                toast.success('Marked as shipped!');
                setSelectedRequest(null);
              } catch {
                toast.error('Failed to update. Please try again.');
              }
            }}
            onPickup={async () => {
              try {
                await confirmPickup(selectedRequest.id);
                toast.success('Pickup confirmed!');
                setSelectedRequest(null);
              } catch {
                toast.error('Failed to update. Please try again.');
              }
            }}
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
  color: 'amber' | 'blue' | 'green' | 'orange';
  loading?: boolean;
}

function StatsCard({ title, value, icon, color, loading }: StatsCardProps) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
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

interface RequestDetailViewProps {
  request: RefurbRequest;
  onShip: (expectedDelivery: string) => Promise<void>;
  onPickup: () => Promise<void>;
}

function RequestDetailView({ request, onShip, onPickup }: RequestDetailViewProps) {
  const [expectedDelivery, setExpectedDelivery] = useState(
    format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') // 3 days from now default
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const config = STATUS_CONFIG[request.status];

  const handleShip = async () => {
    setIsSubmitting(true);
    await onShip(expectedDelivery);
    setIsSubmitting(false);
  };

  const handlePickup = async () => {
    setIsSubmitting(true);
    await onPickup();
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`${config.bg} ${config.border} border rounded-xl p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} size="lg" />
          </div>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>
      </div>

      {/* Request Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Request Info
          </h4>
          <div className="flex justify-between">
            <span className="text-gray-500">Request ID</span>
            <span className="font-mono font-bold">{request.request_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Instrument</span>
            <span className="font-semibold">{request.instrument_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Quantity</span>
            <span className="font-semibold text-lg">{request.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Requested</span>
            <span>{formatDate(request.created_at)}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Location & Tech
          </h4>
          <div className="flex justify-between">
            <span className="text-gray-500">Location</span>
            <span className="font-semibold">{request.location?.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Store #</span>
            <span>{request.location?.store_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tech</span>
            <span className="font-semibold">{request.technician?.name}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
          Timeline
        </h4>
        <div className="space-y-3">
          <TimelineItem
            label="Requested"
            date={request.created_at}
            isComplete
          />
          <TimelineItem
            label="Shipped"
            date={request.shipped_date}
            isComplete={!!request.shipped_date}
          />
          {request.expected_delivery && (
            <TimelineItem
              label="Expected Delivery"
              date={request.expected_delivery}
              isComplete={['Received', 'In Progress', 'Complete', 'Picked Up'].includes(request.status)}
            />
          )}
          <TimelineItem
            label="Work Started"
            date={request.started_date}
            isComplete={!!request.started_date}
          />
          <TimelineItem
            label="Completed"
            date={request.completed_date}
            isComplete={!!request.completed_date}
          />
          <TimelineItem
            label="Picked Up"
            date={request.picked_up_date}
            isComplete={!!request.picked_up_date}
          />
        </div>
      </div>

      {/* Notes */}
      {request.notes && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">
            Notes
          </h4>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-3 italic">
            "{request.notes}"
          </p>
        </div>
      )}

      {/* Actions */}
      {request.status === 'Requested' && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">Ship this request</h4>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                Expected Delivery Date
              </label>
              <Input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <Button
              onClick={handleShip}
              isLoading={isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Mark as Shipped
            </Button>
          </div>
        </div>
      )}

      {request.status === 'Complete' && (
        <div className="pt-4 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PackageCheck className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Ready for Pickup</p>
                  <p className="text-sm text-green-700">
                    Tech has completed the refurb work
                  </p>
                </div>
              </div>
              <Button
                variant="success"
                onClick={handlePickup}
                isLoading={isSubmitting}
              >
                Confirm Pickup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ label, date, isComplete }: { label: string; date: string | null; isComplete: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-3 h-3 rounded-full ${
          isComplete ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      <span className={`flex-1 ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
        {label}
      </span>
      <span className={`text-sm ${isComplete ? 'text-gray-600' : 'text-gray-400'}`}>
        {date ? formatDate(date) : '—'}
      </span>
    </div>
  );
}
