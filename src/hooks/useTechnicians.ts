import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Technician } from '../types';

export function useTechnicians(locationId?: string) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTechnicians() {
      try {
        let query = supabase
          .from('technicians')
          .select('*, location:locations(*)')
          .eq('is_active', true)
          .order('name');

        if (locationId) {
          query = query.eq('location_id', locationId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setTechnicians(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch technicians');
      } finally {
        setLoading(false);
      }
    }

    fetchTechnicians();
  }, [locationId]);

  const verifyPin = async (techId: string, pin: string): Promise<boolean> => {
    const tech = technicians.find((t) => t.id === techId);
    return tech?.pin === pin;
  };

  return { technicians, loading, error, verifyPin };
}

export function useAllTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*, location:locations(*)')
        .order('name');

      if (error) throw error;
      setTechnicians(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch technicians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const addTechnician = async (tech: {
    name: string;
    email?: string;
    location_id: string;
    pin: string;
  }) => {
    const { data, error } = await supabase
      .from('technicians')
      .insert([tech])
      .select()
      .single();

    if (error) throw error;
    await fetchTechnicians();
    return data;
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>) => {
    const { error } = await supabase
      .from('technicians')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchTechnicians();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateTechnician(id, { is_active: isActive });
  };

  return {
    technicians,
    loading,
    error,
    addTechnician,
    updateTechnician,
    toggleActive,
    refetch: fetchTechnicians,
  };
}
