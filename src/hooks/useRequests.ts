import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RefurbRequest, RequestStatus, InstrumentType } from '../types';
import { format } from 'date-fns';

interface RequestFilters {
  locationId?: string;
  techId?: string;
  status?: RequestStatus;
  excludePickedUp?: boolean;
}

// Generate unique request ID: STORE-YYYYMMDD-XXXX
async function generateRequestId(storeNumber: string): Promise<string> {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const prefix = `${storeNumber}-${dateStr}`;

  // Get count of requests today for this store
  const { count } = await supabase
    .from('refurb_requests')
    .select('id', { count: 'exact', head: true })
    .like('request_id', `${prefix}%`);

  const sequence = String((count || 0) + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
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
      if (filters.excludePickedUp) {
        query = query.neq('status', 'Picked Up');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Auto-update status for shipped items where delivery date has passed
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedData = await Promise.all(
        (data || []).map(async (req) => {
          if (
            req.status === 'Shipped' &&
            req.expected_delivery &&
            new Date(req.expected_delivery) <= today
          ) {
            // Update to Received
            await supabase
              .from('refurb_requests')
              .update({ status: 'Received', updated_at: new Date().toISOString() })
              .eq('id', req.id);
            return { ...req, status: 'Received' as RequestStatus };
          }
          return req;
        })
      );

      setRequests(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [filters.locationId, filters.techId, filters.status, filters.excludePickedUp]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (request: {
    location_id: string;
    tech_id: string;
    instrument_type: InstrumentType;
    quantity: number;
    notes?: string;
  }, storeNumber: string) => {
    const request_id = await generateRequestId(storeNumber);

    const { data, error } = await supabase
      .from('refurb_requests')
      .insert([{
        ...request,
        request_id,
        status: 'Requested',
      }])
      .select('*, location:locations(*), technician:technicians(*)')
      .single();

    if (error) throw error;
    await fetchRequests();
    return data;
  };

  const updateStatus = async (
    id: string,
    status: RequestStatus,
    additionalData?: {
      shipped_date?: string;
      expected_delivery?: string;
      started_date?: string;
      completed_date?: string;
      picked_up_date?: string;
    }
  ) => {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    const { error } = await supabase
      .from('refurb_requests')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchRequests();
  };

  // Tech actions
  const startWork = async (id: string) => {
    await updateStatus(id, 'In Progress', {
      started_date: new Date().toISOString(),
    });
  };

  const completeWork = async (id: string) => {
    await updateStatus(id, 'Complete', {
      completed_date: new Date().toISOString(),
    });
  };

  // Hub actions
  const shipRequest = async (id: string, expectedDelivery: string) => {
    await updateStatus(id, 'Shipped', {
      shipped_date: new Date().toISOString(),
      expected_delivery: expectedDelivery,
    });
  };

  const confirmPickup = async (id: string) => {
    await updateStatus(id, 'Picked Up', {
      picked_up_date: new Date().toISOString(),
    });
  };

  return {
    requests,
    loading,
    error,
    createRequest,
    updateStatus,
    startWork,
    completeWork,
    shipRequest,
    confirmPickup,
    refetch: fetchRequests,
  };
}

export function useRequestStats() {
  const [stats, setStats] = useState({
    requested: 0,
    shipped: 0,
    inProgress: 0,
    readyForPickup: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [requestedRes, shippedRes, inProgressRes, completeRes] = await Promise.all([
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Requested'),
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .in('status', ['Shipped', 'Received']),
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'In Progress'),
          supabase
            .from('refurb_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Complete'),
        ]);

        setStats({
          requested: requestedRes.count || 0,
          shipped: shippedRes.count || 0,
          inProgress: inProgressRes.count || 0,
          readyForPickup: completeRes.count || 0,
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
