import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, User, KeyRound, AlertCircle } from 'lucide-react';
import { Button, Card, Select, Input } from '../../components/ui';
import { PageContainer } from '../../components/layout';
import { useLocations, useTechnicians } from '../../hooks';
import { TECH_SESSION_KEY } from '../../lib/constants';
import { setStorageItem } from '../../lib/utils';
import type { TechSession } from '../../types';

export default function TechPortal() {
  const navigate = useNavigate();
  const { locations, loading: locationsLoading } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { technicians, loading: techsLoading, verifyPin } = useTechnicians(selectedLocationId);

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.city} (${loc.store_number})`,
  }));

  const techOptions = technicians.map((tech) => ({
    value: tech.id,
    label: tech.name,
  }));

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocationId(e.target.value);
    setSelectedTechId('');
    setPin('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedLocationId || !selectedTechId || !pin) {
      setError('Please fill in all fields');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await verifyPin(selectedTechId, pin);

      if (!isValid) {
        setError('Invalid PIN. Please try again.');
        setIsVerifying(false);
        return;
      }

      const selectedTech = technicians.find((t) => t.id === selectedTechId);
      const selectedLocation = locations.find((l) => l.id === selectedLocationId);

      if (!selectedTech || !selectedLocation) {
        setError('Something went wrong. Please try again.');
        setIsVerifying(false);
        return;
      }

      const session: TechSession = {
        locationId: selectedLocationId,
        techId: selectedTechId,
        techName: selectedTech.name,
        locationCity: selectedLocation.city,
        storeNumber: selectedLocation.store_number,
      };

      setStorageItem(TECH_SESSION_KEY, session);
      navigate('/tech/request');
    } catch {
      setError('Failed to verify. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <PageContainer maxWidth="sm">
      <div className="min-h-screen flex flex-col justify-center py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gc-red rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">GC</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            TECH PORTAL
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to submit refurb requests
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Location</span>
              </div>
              <Select
                id="location"
                value={selectedLocationId}
                onChange={handleLocationChange}
                options={locationOptions}
                placeholder={locationsLoading ? 'Loading...' : 'Select your location...'}
                disabled={locationsLoading}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Your Name</span>
              </div>
              <Select
                id="tech"
                value={selectedTechId}
                onChange={(e) => {
                  setSelectedTechId(e.target.value);
                  setPin('');
                  setError('');
                }}
                options={techOptions}
                placeholder={
                  !selectedLocationId
                    ? 'Select location first'
                    : techsLoading
                      ? 'Loading...'
                      : 'Select your name...'
                }
                disabled={!selectedLocationId || techsLoading}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">PIN</span>
              </div>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(value);
                  setError('');
                }}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                disabled={!selectedTechId}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isVerifying}
              disabled={!selectedLocationId || !selectedTechId || pin.length !== 4}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          All requests must specify exact quantities.
          <br />
          Verbal requests will not be accepted.
        </p>
      </div>
    </PageContainer>
  );
}
