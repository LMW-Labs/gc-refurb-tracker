import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Calendar } from 'lucide-react';
import { Card } from '../../components/ui';
import { Header, PageContainer } from '../../components/layout';
import { StatusBadge, PriorityBadge } from '../../components/shared';
import { useRequests } from '../../hooks';
import { TECH_SESSION_KEY } from '../../lib/constants';
import { getStorageItem, formatRequestNumber, formatRelativeTime, formatDate } from '../../lib/utils';
import type { TechSession, RefurbRequest } from '../../types';

export default function MyHistory() {
  const navigate = useNavigate();
  const [session, setSession] = useState<TechSession | null>(null);

  useEffect(() => {
    const savedSession = getStorageItem<TechSession>(TECH_SESSION_KEY);
    if (!savedSession) {
      navigate('/tech');
      return;
    }
    setSession(savedSession);
  }, [navigate]);

  const { requests, loading } = useRequests({
    techId: session?.techId,
  });

  if (!session) {
    return null;
  }

  return (
    <>
      <Header
        variant="tech"
        title={session.techName}
        subtitle={`${session.locationCity} (${session.storeNumber})`}
      />

      <PageContainer maxWidth="2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            MY REQUESTS
          </h1>
          <p className="text-gray-600 mt-1">
            View the status of your refurb requests
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-gc-red border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading your requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Yet</h3>
              <p className="text-gray-600">
                You haven't submitted any refurb requests yet.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}

function RequestCard({ request }: { request: RefurbRequest }) {
  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-gc-red">
              {formatRequestNumber(request.request_number)}
            </span>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>

          <h3 className="text-lg font-semibold text-gray-900">
            {request.quantity_requested}x {request.brand} {request.instrument_type}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {request.category}
          </p>

          {request.notes && (
            <p className="text-sm text-gray-600 mt-2 italic">
              "{request.notes}"
            </p>
          )}
        </div>

        <div className="flex flex-col items-end text-sm text-gray-500 space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatRelativeTime(request.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(request.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Fulfillment Info */}
      {request.status === 'Fulfilled' && request.quantity_fulfilled !== null && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Fulfilled:</span> {request.quantity_fulfilled} of {request.quantity_requested} units
              {request.fulfilled_by && (
                <span> by {request.fulfilled_by}</span>
              )}
              {request.fulfilled_date && (
                <span> on {formatDate(request.fulfilled_date)}</span>
              )}
            </p>
            {request.fulfillment_notes && (
              <p className="text-sm text-green-700 mt-1 italic">
                "{request.fulfillment_notes}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cancelled Info */}
      {request.status === 'Cancelled' && request.fulfillment_notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 italic">
              Reason: "{request.fulfillment_notes}"
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
