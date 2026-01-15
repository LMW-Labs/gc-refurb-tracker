import { useState } from 'react';
import { Button, Select, Input } from '../ui';
import { StatusBadge, PriorityBadge } from '../shared';
import { STATUSES } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import type { RefurbRequest, Status } from '../../types';
import toast from 'react-hot-toast';

interface StatusUpdateFormProps {
  request: RefurbRequest;
  onUpdate: (
    requestId: string,
    status: Status,
    fulfillmentData?: {
      quantity_fulfilled?: number;
      fulfilled_by?: string;
      fulfillment_notes?: string;
    }
  ) => Promise<void>;
  onCancel: () => void;
}

export default function StatusUpdateForm({ request, onUpdate, onCancel }: StatusUpdateFormProps) {
  const [newStatus, setNewStatus] = useState<Status>(request.status);
  const [quantityFulfilled, setQuantityFulfilled] = useState(request.quantity_fulfilled || request.quantity_requested);
  const [fulfilledBy, setFulfilledBy] = useState(request.fulfilled_by || 'Austin');
  const [notes, setNotes] = useState(request.fulfillment_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = STATUSES.map((s) => ({ value: s, label: s }));

  const showFulfillmentFields = newStatus === 'Fulfilled';
  const showNotesField = newStatus === 'Fulfilled' || newStatus === 'Cancelled';
  const quantityMismatch = showFulfillmentFields && quantityFulfilled !== request.quantity_requested;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate(request.id, newStatus, {
        quantity_fulfilled: showFulfillmentFields ? quantityFulfilled : undefined,
        fulfilled_by: showFulfillmentFields ? fulfilledBy : undefined,
        fulfillment_notes: showNotesField ? notes : undefined,
      });
      toast.success(`Request updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update request');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Request Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <span className="text-sm text-gray-500">{formatDate(request.created_at)}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900">
          {request.quantity_requested}x {request.brand} {request.instrument_type}
        </h3>

        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
          <div>
            <span className="text-gray-500">Category:</span>
            <span className="ml-2 font-medium">{request.category}</span>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <span className="ml-2 font-medium">{request.location?.city}</span>
          </div>
          <div>
            <span className="text-gray-500">Requested by:</span>
            <span className="ml-2 font-medium">{request.technician?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Store:</span>
            <span className="ml-2 font-medium">{request.location?.store_number}</span>
          </div>
        </div>

        {request.notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="text-gray-500 text-sm">Notes:</span>
            <p className="text-sm text-gray-700 italic mt-1">"{request.notes}"</p>
          </div>
        )}
      </div>

      {/* Status Update */}
      <div>
        <Select
          id="status"
          label="Update Status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as Status)}
          options={statusOptions}
        />
      </div>

      {/* Fulfillment Fields */}
      {showFulfillmentFields && (
        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800">Fulfillment Details</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Fulfilled
              </label>
              <input
                type="number"
                value={quantityFulfilled}
                onChange={(e) => setQuantityFulfilled(parseInt(e.target.value) || 0)}
                min={0}
                max={999}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gc-red"
              />
              {quantityMismatch && (
                <p className="text-xs text-amber-600 mt-1">
                  Requested: {request.quantity_requested}
                </p>
              )}
            </div>

            <Input
              id="fulfilledBy"
              label="Fulfilled By"
              value={fulfilledBy}
              onChange={(e) => setFulfilledBy(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Notes Field */}
      {showNotesField && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {newStatus === 'Cancelled' ? 'Cancellation Reason' : 'Fulfillment Notes'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={
              newStatus === 'Cancelled'
                ? 'Enter reason for cancellation...'
                : 'Any notes about this fulfillment...'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gc-red"
          />
        </div>
      )}

      {/* Warning for quantity mismatch */}
      {quantityMismatch && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <strong>Note:</strong> Fulfilling {quantityFulfilled} of {request.quantity_requested} requested units.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={newStatus === request.status && !showFulfillmentFields}
        >
          Update Status
        </Button>
      </div>
    </div>
  );
}
