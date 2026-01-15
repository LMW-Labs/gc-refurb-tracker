import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DailyCompletion, Category } from '../types';
import { subDays, startOfDay } from 'date-fns';

interface CompletionFilters {
  locationId?: string;
  techId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useCompletions(filters: CompletionFilters = {}) {
  const [completions, setCompletions] = useState<DailyCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('daily_completions')
        .select('*, location:locations(*), technician:technicians(*)')
        .order('completion_date', { ascending: false });

      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters.techId) {
        query = query.eq('tech_id', filters.techId);
      }
      if (filters.startDate) {
        query = query.gte('completion_date', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters.endDate) {
        query = query.lte('completion_date', filters.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCompletions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch completions');
    } finally {
      setLoading(false);
    }
  }, [filters.locationId, filters.techId, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  const createCompletion = async (completion: {
    location_id: string;
    tech_id: string;
    category: Category;
    instrument_type: string;
    brand: string;
    quantity_completed: number;
    yellow_armband_applied: boolean;
    qc_card_signed: boolean;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('daily_completions')
      .insert([completion])
      .select()
      .single();

    if (error) throw error;
    await fetchCompletions();
    return data;
  };

  return {
    completions,
    loading,
    error,
    createCompletion,
    refetch: fetchCompletions,
  };
}

interface LocationCompletionStats {
  locationId: string;
  city: string;
  storeNumber: string;
  count: number;
}

export function useCompletionMetrics() {
  const [sevenDayStats, setSevenDayStats] = useState<LocationCompletionStats[]>([]);
  const [thirtyDayStats, setThirtyDayStats] = useState<LocationCompletionStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const now = new Date();
        const sevenDaysAgo = startOfDay(subDays(now, 7));
        const thirtyDaysAgo = startOfDay(subDays(now, 30));

        // Fetch locations first
        const { data: locations } = await supabase
          .from('locations')
          .select('id, city, store_number');

        if (!locations) return;

        // Fetch 7-day completions
        const { data: sevenDayData } = await supabase
          .from('daily_completions')
          .select('location_id, quantity_completed')
          .gte('completion_date', sevenDaysAgo.toISOString().split('T')[0]);

        // Fetch 30-day completions
        const { data: thirtyDayData } = await supabase
          .from('daily_completions')
          .select('location_id, quantity_completed')
          .gte('completion_date', thirtyDaysAgo.toISOString().split('T')[0]);

        // Aggregate by location
        const aggregate = (data: { location_id: string; quantity_completed: number }[] | null) => {
          const counts: Record<string, number> = {};
          data?.forEach((item) => {
            counts[item.location_id] = (counts[item.location_id] || 0) + item.quantity_completed;
          });
          return locations.map((loc) => ({
            locationId: loc.id,
            city: loc.city,
            storeNumber: loc.store_number,
            count: counts[loc.id] || 0,
          }));
        };

        setSevenDayStats(aggregate(sevenDayData));
        setThirtyDayStats(aggregate(thirtyDayData));
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return { sevenDayStats, thirtyDayStats, loading };
}
