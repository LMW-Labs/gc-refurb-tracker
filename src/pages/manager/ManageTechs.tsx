import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Edit2, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Select, Modal } from '../../components/ui';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '../../components/ui/Table';
import { Header, PageContainer } from '../../components/layout';
import { useAllTechnicians, useLocations } from '../../hooks';
import { MANAGER_AUTH_KEY } from '../../lib/constants';
import { getStorageItem } from '../../lib/utils';
import type { Technician } from '../../types';
import toast from 'react-hot-toast';

export default function ManageTechs() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  const { locations } = useLocations();
  const { technicians, loading, addTechnician, updateTechnician, toggleActive } = useAllTechnicians();

  useEffect(() => {
    const auth = getStorageItem<{ authenticated: boolean }>(MANAGER_AUTH_KEY);
    if (!auth?.authenticated) {
      navigate('/manager');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  const handleAddTech = async (data: { name: string; email?: string; location_id: string; pin: string }) => {
    try {
      await addTechnician(data);
      toast.success('Technician added successfully');
      setShowAddModal(false);
    } catch (err) {
      toast.error('Failed to add technician');
      console.error(err);
    }
  };

  const handleUpdateTech = async (id: string, data: Partial<Technician>) => {
    try {
      await updateTechnician(id, data);
      toast.success('Technician updated successfully');
      setEditingTech(null);
    } catch (err) {
      toast.error('Failed to update technician');
      console.error(err);
    }
  };

  const handleToggleActive = async (tech: Technician) => {
    try {
      await toggleActive(tech.id, !tech.is_active);
      toast.success(`${tech.name} ${tech.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    }
  };

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.city} (${loc.store_number})`,
  }));

  // Group technicians by location
  const techsByLocation = locations.map((loc) => ({
    location: loc,
    techs: technicians.filter((t) => t.location_id === loc.id),
  }));

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header variant="manager" />

      <PageContainer maxWidth="full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              MANAGE TECHNICIANS
            </h1>
            <p className="text-gray-600 mt-1">
              Add, edit, or deactivate repair technicians
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Technician
          </Button>
        </div>

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-gc-red border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading technicians...</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {techsByLocation.map(({ location, techs }) => (
              <Card key={location.id} padding="none">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="font-heading font-semibold text-gray-900">
                    {location.city}
                    <span className="text-gray-500 font-normal ml-2">({location.store_number})</span>
                  </h2>
                </div>

                {techs.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No technicians at this location
                  </div>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Email</TableHeader>
                        <TableHeader>PIN</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {techs.map((tech) => (
                        <TableRow key={tech.id}>
                          <TableCell>
                            <span className={`font-medium ${!tech.is_active ? 'text-gray-400' : ''}`}>
                              {tech.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={!tech.is_active ? 'text-gray-400' : 'text-gray-600'}>
                              {tech.email || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className={`text-sm ${!tech.is_active ? 'text-gray-400' : ''}`}>
                              {tech.pin}
                            </code>
                          </TableCell>
                          <TableCell>
                            {tech.is_active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingTech(tech)}
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(tech)}
                                title={tech.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {tech.is_active ? (
                                  <ToggleRight className="w-5 h-5 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {technicians.length} total technicians ({technicians.filter((t) => t.is_active).length} active)
        </div>
      </PageContainer>

      {/* Add Technician Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Technician"
        size="md"
      >
        <TechForm
          locations={locationOptions}
          onSubmit={handleAddTech}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Technician Modal */}
      <Modal
        isOpen={!!editingTech}
        onClose={() => setEditingTech(null)}
        title="Edit Technician"
        size="md"
      >
        {editingTech && (
          <TechForm
            locations={locationOptions}
            initialData={editingTech}
            onSubmit={(data) => handleUpdateTech(editingTech.id, data)}
            onCancel={() => setEditingTech(null)}
          />
        )}
      </Modal>
    </>
  );
}

interface TechFormProps {
  locations: { value: string; label: string }[];
  initialData?: Technician;
  onSubmit: (data: { name: string; email?: string; location_id: string; pin: string }) => void;
  onCancel: () => void;
}

function TechForm({ locations, initialData, onSubmit, onCancel }: TechFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [locationId, setLocationId] = useState(initialData?.location_id || '');
  const [pin, setPin] = useState(initialData?.pin || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!locationId) newErrors.location = 'Location is required';
    if (!pin || pin.length !== 4) newErrors.pin = 'PIN must be 4 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      email: email.trim() || undefined,
      location_id: locationId,
      pin,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Enter technician name"
      />

      <Input
        id="email"
        label="Email (Optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email address"
      />

      <Select
        id="location"
        label="Location *"
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        options={locations}
        placeholder="Select location..."
        error={errors.location}
      />

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          PIN * (4 digits)
        </label>
        <Input
          id="pin"
          type="text"
          value={pin}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(value);
          }}
          maxLength={4}
          error={errors.pin}
          placeholder="Enter 4-digit PIN"
        />
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Please fill in all required fields</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? 'Save Changes' : 'Add Technician'}
        </Button>
      </div>
    </form>
  );
}
