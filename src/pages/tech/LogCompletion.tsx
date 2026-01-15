import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui';
import { Header, PageContainer } from '../../components/layout';
import { InstrumentSelector, QuantityInput } from '../../components/shared';
import { useCompletions } from '../../hooks';
import { TECH_SESSION_KEY } from '../../lib/constants';
import { getStorageItem } from '../../lib/utils';
import type { TechSession, Category } from '../../types';
import toast from 'react-hot-toast';

export default function LogCompletion() {
  const navigate = useNavigate();
  const [session, setSession] = useState<TechSession | null>(null);
  const { createCompletion } = useCompletions();

  // Form state
  const [category, setCategory] = useState<Category | ''>('');
  const [instrumentType, setInstrumentType] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [yellowArmband, setYellowArmband] = useState(false);
  const [qcCardSigned, setQcCardSigned] = useState(false);
  const [notes, setNotes] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const savedSession = getStorageItem<TechSession>(TECH_SESSION_KEY);
    if (!savedSession) {
      navigate('/tech');
      return;
    }
    setSession(savedSession);
  }, [navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) newErrors.category = 'Category is required';
    if (!instrumentType) newErrors.instrumentType = 'Instrument type is required';
    if (!brand) newErrors.brand = 'Brand is required';
    if (quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (!yellowArmband) newErrors.yellowArmband = 'Yellow armband verification is required';
    if (!qcCardSigned) newErrors.qcCardSigned = 'QC card verification is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !session) return;

    setIsSubmitting(true);

    try {
      await createCompletion({
        location_id: session.locationId,
        tech_id: session.techId,
        category: category as Category,
        instrument_type: instrumentType,
        brand,
        quantity_completed: quantity,
        yellow_armband_applied: yellowArmband,
        qc_card_signed: qcCardSigned,
        notes: notes || undefined,
      });

      setShowConfirmation(true);

      // Reset form
      setCategory('');
      setInstrumentType('');
      setBrand('');
      setQuantity(1);
      setYellowArmband(false);
      setQcCardSigned(false);
      setNotes('');
    } catch (err) {
      toast.error('Failed to log completion. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  if (!session) {
    return null;
  }

  const qcError = errors.yellowArmband || errors.qcCardSigned;

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
              LOG COMPLETION
            </h1>
            <p className="text-gray-600 mt-1">
              Only log instruments with yellow armband AND signed QC card
            </p>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">QC Requirements</p>
              <p className="text-sm text-amber-700 mt-1">
                Both the yellow armband AND signed QC card are REQUIRED before logging a completion.
                Do not log instruments that haven't passed QC inspection.
              </p>
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

            <QuantityInput
              label="Quantity Completed *"
              value={quantity}
              onChange={setQuantity}
              min={1}
              error={errors.quantity}
            />

            {/* QC Verification */}
            <div className={`p-4 rounded-lg border-2 ${qcError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="font-semibold text-gray-900 mb-3">QC Verification *</p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={yellowArmband}
                    onChange={(e) => setYellowArmband(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gc-red focus:ring-gc-red"
                  />
                  <span className="text-gray-700">Yellow armband has been applied</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qcCardSigned}
                    onChange={(e) => setQcCardSigned(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gc-red focus:ring-gc-red"
                  />
                  <span className="text-gray-700">QC card has been signed</span>
                </label>
              </div>

              {qcError && (
                <p className="text-sm text-red-600 mt-2">
                  Both QC checks must be confirmed before submitting
                </p>
              )}
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
                placeholder="Any additional details about the completion..."
              />
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Please fill in all required fields and complete QC verification</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Log Completion
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
            Completion Logged!
          </h3>
          <p className="text-gray-600 mb-6">
            Your work has been recorded. Keep up the great work!
          </p>
          <Button
            className="w-full"
            onClick={handleCloseConfirmation}
          >
            Log Another
          </Button>
        </div>
      </Modal>
    </>
  );
}
