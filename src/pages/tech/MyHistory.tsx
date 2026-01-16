import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Clock, Calendar, Truck, PlayCircle, CheckCircle,
  PackageCheck, Wrench, Archive, AlertCircle
} from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui';
import { Header, PageContainer } from '../../components/layout';
import { StatusBadge } from '../../components/shared';
import { useRequests } from '../../hooks';
import { TECH_SESSION_KEY, STATUS_CONFIG } from '../../lib/constants';
import { getStorageItem, formatRelativeTime, formatDate } from '../../lib/utils';
import type { TechSession, RefurbRequest, RequestStatus } from '../../types';
import toast from 'react-hot-toast';

export default function MyHistory() {
  const navigate = useNavigate();
  const [session, setSession] = useState<TechSession | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RefurbRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const savedSession = getStorageItem<TechSession>(TECH_SESSION_KEY);
    if (!savedSession) {
      navigate('/tech');
      return;
    }
    setSession(savedSession);
  }, [navigate]);

  const { requests, loading, startWork, completeWork } = useRequests({
    techId: session?.techId,
    excludePickedUp: true,
  });

  const handleStartWork = async (id: string) => {
    setIsUpdating(true);
    try {
      await startWork(id);
      toast.success('Work started! Good luck with the refurb.');
      setSelectedRequest(null);
    } catch {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteWork = async (id: string) => {
    setIsUpdating(true);
    try {
      await completeWork(id);
      toast.success('Marked complete! Hub has been notified for pickup.');
      setSelectedRequest(null);
    } catch {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session) {
    return null;
  }

  // Group requests by status for better organization
  const activeRequests = requests.filter(r =>
    ['Received', 'In Progress'].includes(r.status)
  );
  const pendingRequests = requests.filter(r =>
    ['Requested', 'Shipped'].includes(r.status)
  );
  const completedRequests = requests.filter(r =>
    r.status === 'Complete'
  );

  return (
    <>
      <Header
        variant="tech"
        title={session.techName}
        subtitle={`${session.locationCity} (${session.storeNumber})`}
      />

      <PageContainer maxWidth="2xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            My Requests
          </h1>
          <p className="text-gray-600 mt-1">
            Track and update your refurb instrument requests
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-gc-red border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading your requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Requests</h3>
            <p className="text-gray-600 mb-4">
              You don't have any refurb requests yet.
            </p>
            <Button onClick={() => navigate('/tech/request')}>
              Submit a Request
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Work Section */}
            {activeRequests.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ready to Work ({activeRequests.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {activeRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onSelect={() => setSelectedRequest(request)}
                      showActions
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Pending Section */}
            {pendingRequests.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Incoming ({pendingRequests.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onSelect={() => setSelectedRequest(request)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Section */}
            {completedRequests.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ready for Pickup ({completedRequests.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {completedRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onSelect={() => setSelectedRequest(request)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </PageContainer>

      {/* Request Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Request Details"
        size="md"
      >
        {selectedRequest && (
          <RequestDetail
            request={selectedRequest}
            onStartWork={() => handleStartWork(selectedRequest.id)}
            onCompleteWork={() => handleCompleteWork(selectedRequest.id)}
            isUpdating={isUpdating}
          />
        )}
      </Modal>
    </>
  );
}

interface RequestCardProps {
  request: RefurbRequest;
  onSelect: () => void;
  showActions?: boolean;
}

function RequestCard({ request, onSelect, showActions }: RequestCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: getStatusColor(request.status) }}
      onClick={onSelect}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {request.request_id}
            </span>
            <StatusBadge status={request.status} size="sm" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900">
            {request.quantity}x {request.instrument_type}
          </h3>

          {request.notes && (
            <p className="text-sm text-gray-600 mt-2 italic line-clamp-2">
              "{request.notes}"
            </p>
          )}

          {/* Status-specific info */}
          <div className="mt-3 text-sm text-gray-500">
            {request.status === 'Shipped' && request.expected_delivery && (
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Expected: {formatDate(request.expected_delivery)}
              </span>
            )}
            {request.status === 'In Progress' && request.started_date && (
              <span className="flex items-center gap-1">
                <Wrench className="w-4 h-4" />
                Started: {formatRelativeTime(request.started_date)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(request.created_at)}</span>
          </div>

          {showActions && (
            <div className="mt-2">
              {request.status === 'Received' && (
                <Button size="sm" variant="primary">
                  <PlayCircle className="w-4 h-4 mr-1" />
                  Start Work
                </Button>
              )}
              {request.status === 'In Progress' && (
                <Button size="sm" variant="success">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface RequestDetailProps {
  request: RefurbRequest;
  onStartWork: () => void;
  onCompleteWork: () => void;
  isUpdating: boolean;
}

function RequestDetail({ request, onStartWork, onCompleteWork, isUpdating }: RequestDetailProps) {
  const config = STATUS_CONFIG[request.status];

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`${config.bg} ${config.border} border rounded-xl p-4`}>
        <div className="flex items-center gap-3">
          <StatusIcon status={request.status} />
          <div>
            <p className={`font-semibold ${config.text}`}>{request.status}</p>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Request Info */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
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
          <span className="font-semibold">{request.quantity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Requested</span>
          <span>{formatDate(request.created_at)}</span>
        </div>
        {request.shipped_date && (
          <div className="flex justify-between">
            <span className="text-gray-500">Shipped</span>
            <span>{formatDate(request.shipped_date)}</span>
          </div>
        )}
        {request.expected_delivery && (
          <div className="flex justify-between">
            <span className="text-gray-500">Expected Delivery</span>
            <span>{formatDate(request.expected_delivery)}</span>
          </div>
        )}
        {request.started_date && (
          <div className="flex justify-between">
            <span className="text-gray-500">Work Started</span>
            <span>{formatDate(request.started_date)}</span>
          </div>
        )}
        {request.completed_date && (
          <div className="flex justify-between">
            <span className="text-gray-500">Completed</span>
            <span>{formatDate(request.completed_date)}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {request.notes && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Notes</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-3 italic">
            "{request.notes}"
          </p>
        </div>
      )}

      {/* Actions */}
      {request.status === 'Received' && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            These instruments have arrived. Ready to start the refurb work?
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={onStartWork}
            isLoading={isUpdating}
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Start Working
          </Button>
        </div>
      )}

      {request.status === 'In Progress' && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Finished with the refurb? Mark as complete to notify the hub for pickup.
          </p>
          <Button
            className="w-full"
            size="lg"
            variant="success"
            onClick={onCompleteWork}
            isLoading={isUpdating}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Mark Complete
          </Button>
        </div>
      )}

      {request.status === 'Complete' && (
        <div className="pt-4 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-semibold">
              Ready for Pickup
            </p>
            <p className="text-sm text-green-700">
              Hub has been notified and will arrange pickup.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: RequestStatus }) {
  const iconClass = "w-8 h-8";

  switch (status) {
    case 'Requested':
      return <Clock className={`${iconClass} text-amber-600`} />;
    case 'Shipped':
      return <Truck className={`${iconClass} text-blue-600`} />;
    case 'Received':
      return <PackageCheck className={`${iconClass} text-purple-600`} />;
    case 'In Progress':
      return <Wrench className={`${iconClass} text-orange-600`} />;
    case 'Complete':
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    case 'Picked Up':
      return <Archive className={`${iconClass} text-gray-600`} />;
    default:
      return <AlertCircle className={`${iconClass} text-gray-600`} />;
  }
}

function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    'Requested': '#f59e0b',
    'Shipped': '#3b82f6',
    'Received': '#8b5cf6',
    'In Progress': '#f97316',
    'Complete': '#22c55e',
    'Picked Up': '#6b7280',
  };
  return colors[status] || '#6b7280';
}
