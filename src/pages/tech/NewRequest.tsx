import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card, Select, Modal } from '../../components/ui';
import { Header, PageContainer } from '../../components/layout';
import { InstrumentSelector, QuantityInput } from '../../components/shared';
import { useRequests } from '../../hooks';
import { TECH_SESSION_KEY, PRIORITIES } from '../../lib/constants';
import { getStorageItem, formatRequestNumber } from '../../lib/utils';
import type { TechSession, Category, Priority } from '../../types';
import toast from 'react-hot-toast';

export default function NewRequest() {
  const navigate = useNavigate();
  const [session, setSession] = useState<TechSession | null>(null);
  const { createRequest } = useRequests();

  // Form state
  const [category, setCategory] = useState<Category | ''>('');
  const [instrumentType, setInstrumentType] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestNumber, setRequestNumber] = useState<number | null>(null);

  useEffect(() => {
    const savedSession = getStorageItem<TechSession>(TECH_SESSION_KEY);
    if (!savedSession) {
      navigate('/tech');
      return;
    }
    setSession(savedSession);
  }, [navigate]);

  const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: p }));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) newErrors.category = 'Category is required';
    if (!instrumentType) newErrors.instrumentType = 'Instrument type is required';
    if (!brand) newErrors.brand = 'Brand is required';
    if (quantity < 1) newErrors.quantity = 'Quantity must be at least 1';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !session) return;

    setIsSubmitting(true);

    try {
      const result = await createRequest({
        location_id: session.locationId,
        tech_id: session.techId,
        category: category as Category,
        instrument_type: instrumentType,
        brand,
        quantity_requested: quantity,
        priority,
        notes: notes || undefined,
      });

      setRequestNumber(result.request_number);
      setShowConfirmation(true);

      // Reset form
      setCategory('');
      setInstrumentType('');
      setBrand('');
      setQuantity(1);
      setPriority('Medium');
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
    setRequestNumber(null);
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
        <Card>
          {/* Form Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              REFURB REQUEST FORM
            </h1>
            <p className="text-gray-600 mt-1">
              All requests must specify exact quantities. Verbal requests will not be accepted.
            </p>
          </div>

          {/* Location Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2 font-semibold">{session.locationCity}</span>
              </div>
              <div>
                <span className="text-gray-500">Store #:</span>
                <span className="ml-2 font-semibold">{session.storeNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Requested by:</span>
                <span className="ml-2 font-semibold">{session.techName}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InstrumentSelector
              category={category}
              instrumentType={instrumentType}
              brand={brand}
              onCategoryChange={setCategory}
              onInstrumentTypeChange={setInstrumentType}
              onBrandChange={setBrand}
              errors={errors}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <QuantityInput
                label="Quantity Needed *"
                value={quantity}
                onChange={setQuantity}
                min={1}
                error={errors.quantity}
              />

              <Select
                id="priority"
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                options={priorityOptions}
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gc-red focus:border-transparent"
                placeholder="Any additional details..."
              />
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
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
              Submit Request
            </Button>
          </form>
        </Card>
      </PageContainer>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
            Request Submitted!
          </h3>
          {requestNumber && (
            <p className="text-2xl font-bold text-gc-red mb-4">
              {formatRequestNumber(requestNumber)}
            </p>
          )}
          <p className="text-gray-600 mb-6">
            Your request has been logged and will be reviewed by the hub manager.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/tech/history')}
            >
              View History
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
