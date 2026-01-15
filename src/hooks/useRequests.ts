import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RefurbRequest, Status, Category } from '../types';

interface RequestFilters {
  locationId?: string;
  techId?: string;
  status?: Status;
  category?: Category;
}

export function useRequests(filters: RequestFilters = {}) {
  const [requests, setRequests] = useState<RefurbRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('refurb_requests')
        .select('*, location:locations(*), technician:technicians(*)')
        .order('created_at', { ascending: false });

      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters.techId) {
        query = query.eq('tech_id', filters.techId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [filters.locationId, filters.techId, filters.status, filters.category]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (request: {
    location_id: string;
    tech_id: string;
    category: Category;
    instrument_type: string;
    brand: string;
    quantity_requested: number;
    priority: string;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('refurb_requests')
      .insert([request])
      .select('*, location:locations(*), technician:technicians(*)')
      .single();

    if (error) throw error;

    // Log the activity
    await supabase.from('activity_log').insert([
      {
        request_id: data.id,
        action: 'REQUEST_CREATED',
        details: { quantity: request.quantity_requested },
        performed_by: data.technician?.name || 'Unknown',
      },
    ]);

    await fetchRequests();
    return data;
  };

  const updateStatus = async (
    requestId: string,
    status: Status,
    fulfillmentData?: {
      quantity_fulfilled?: number;
      fulfilled_by?: string;
      fulfillment_notes?: string;
    }
  ) => {
    const updates: Partial<RefurbRequest> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'Fulfilled' && fulfillmentData) {
      updates.quantity_fulfilled = fulfillmentData.quantity_fulfilled;
      updates.fulfilled_by = fulfillmentData.fulfilled_by;
      updates.fulfillment_notes = fulfillmentData.fulfillment_notes;
      updates.fulfilled_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('refurb_requests')
      .update(updates)
      .eq('id', requestId);

    if (error) throw error;

    // Log the activity
    await supabase.from('activity_log').insert([
      {
        request_id: requestId,
        action: `STATUS_CHANGED_TO_${status.toUpperCase().replace(' ', '_')}`,
        details: fulfillmentData || {},
        performed_by: fulfillmentData?.fulfilled_by || 'Manager',
      },
    ]);

    await fetchRequests();
  };

  return {
    requests,
    loading,
    error,
    createRequest,
    updateStatus,
    refetch: fetchRequests,
  };
}

export function useRequestStats() {
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    fulfilledToday: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingRes, inProgressRes, fulfilledTodayRes, urgentRes] = await Promise.all([
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Pending'),
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'In Progress'),
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Fulfilled')
            .gte('fulfilled_date', today.toISOString()),
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .eq('priority', 'Urgent')
            .in('status', ['Pending', 'In Progress']),
        ]);

        setStats({
          pending: pendingRes.count || 0,
          inProgress: inProgressRes.count || 0,
          fulfilledToday: fulfilledTodayRes.count || 0,
          urgent: urgentRes.count || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading };
}
