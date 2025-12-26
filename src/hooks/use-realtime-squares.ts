'use client';

import { useEffect, useState } from 'react';

import { createSupabaseBrowserClient } from '@/libs/supabase/supabase-browser-client';

type BaseSquare = { id: string };

export function useRealtimeSquares<T extends BaseSquare>(contestId: string, initialSquares: T[]) {
  const [squares, setSquares] = useState<T[]>(initialSquares);

  // Sync state when initialSquares prop changes
  useEffect(() => {
    setSquares(initialSquares);
  }, [initialSquares]);

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`squares:${contestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'squares',
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSquares((prev) => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setSquares((prev) =>
              prev.map((s) => (s.id === (payload.new as T).id ? (payload.new as T) : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setSquares((prev) => prev.filter((s) => s.id !== (payload.old as T).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId]);

  return squares;
}

