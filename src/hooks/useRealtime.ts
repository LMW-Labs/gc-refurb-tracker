import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useRealtimeRequests(onNewRequest: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('refurb_requests_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'refurb_requests',
        },
        async (payload) => {
          // Fetch the full request with location data
          const { data } = await supabase
            .from('refurb_requests')
            .select('*, location:locations(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            toast.success(
              `New request from ${data.location?.city || 'Unknown'} - ${data.quantity}x ${data.instrument_type}`,
              { duration: 5000 }
            );
          }

          onNewRequest();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'refurb_requests',
        },
        () => {
          onNewRequest();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewRequest]);
}
