import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Send, Music } from 'lucide-react';
import { Button, Card, Select, Modal } from '../../components/ui';
import { Header, PageContainer } from '../../components/layout';
import { QuantityInput } from '../../components/shared';
import { useRequests } from '../../hooks';
import { TECH_SESSION_KEY, INSTRUMENTS } from '../../lib/constants';
import { getStorageItem } from '../../lib/utils';
import type { TechSession, InstrumentType } from '../../types';
import toast from 'react-hot-toast';

export default function NewRequest() {
  const navigate = useNavigate();
  const [session, setSession] = useState<TechSession | null>(null);
  const { createRequest } = useRequests();

  // Form state
  const [instrumentType, setInstrumentType] = useState<InstrumentType | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = getStorageItem<TechSession>(TECH_SESSION_KEY);
    if (!savedSession) {
      navigate('/tech');
      return;
    }
    setSession(savedSession);
  }, [navigate]);

  const instrumentOptions = INSTRUMENTS.map((inst) => ({
    value: inst,
    label: inst,
  }));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!instrumentType) newErrors.instrumentType = 'Please select an instrument type';
    if (quantity < 1) newErrors.quantity = 'Quantity must be at least 1';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !session) return;

    setIsSubmitting(true);

    try {
      const result = await createRequest(
        {
          location_id: session.locationId,
          tech_id: session.techId,
          instrument_type: instrumentType as InstrumentType,
          quantity,
          notes: notes || undefined,
        },
        session.storeNumber
      );

      setRequestId(result.request_id);
      setShowConfirmation(true);

      // Reset form
      setInstrumentType('');
      setQuantity(1);
      setNotes('');
    } catch (err) {
      toast.error('Failed to submit request. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setRequestId(null);
  };

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

      <PageContainer maxWidth="lg">
        <div className="max-w-xl mx-auto">
          <Card className="overflow-hidden">
            {/* Form Header with accent bar */}
            <div className="bg-gradient-to-r from-gc-red to-red-700 -mx-6 -mt-6 px-6 py-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-heading font-bold text-white">
                    Request Refurb Instruments
                  </h1>
                  <p className="text-white/80 text-sm">
                    Specify what you need from the hub
                  </p>
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">Location</span>
                  <span className="font-semibold text-gray-900">{session.locationCity}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">Store #</span>
                  <span className="font-semibold text-gray-900">{session.storeNumber}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">Requested by</span>
                  <span className="font-semibold text-gray-900">{session.techName}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Instrument Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-gray-500" />
                    Instrument Type *
                  </span>
                </label>
                <Select
                  id="instrumentType"
                  value={instrumentType}
                  onChange={(e) => {
                    setInstrumentType(e.target.value as InstrumentType);
                    setErrors({});
                  }}
                  options={instrumentOptions}
                  placeholder="Select an instrument..."
                  error={errors.instrumentType}
                />
              </div>

              {/* Quantity */}
              <QuantityInput
                label="Quantity Needed *"
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={50}
                error={errors.quantity}
              />

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gc-red focus:border-transparent transition-shadow"
                  placeholder="Any special requirements or notes..."
                />
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Please fill in all required fields</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
              >
                <Send className="w-5 h-5 mr-2" />
                Submit Request
              </Button>
            </form>
          </Card>

          {/* Info Card */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> After you submit a request, the hub will ship the
              instruments and update the status. You'll see them in "My Requests" when they arrive.
            </p>
          </div>
        </div>
      </PageContainer>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        size="sm"
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            Request Submitted!
          </h3>
          {requestId && (
            <div className="bg-gray-100 rounded-xl py-3 px-4 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Request ID</p>
              <p className="text-xl font-bold text-gc-red font-mono">
                {requestId}
              </p>
            </div>
          )}
          <p className="text-gray-600 mb-6">
            Your request has been sent to the hub. You'll be notified when it ships.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/tech/history')}
            >
              View My Requests
            </Button>
            <Button
              className="flex-1"
              onClick={handleCloseConfirmation}
            >
              New Request
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
