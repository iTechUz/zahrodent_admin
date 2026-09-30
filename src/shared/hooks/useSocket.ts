import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { resolveApiUrl } from '@/lib/api/runtime-config';
import { can } from '@/shared/config/roles';
import type { Lead } from '@/shared/types';

let socket: Socket | null = null;
let socketToken: string | null = null;

function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}

/** One shared socket.io connection, authenticated with the JWT (`auth: { token }`). */
function ensureSocket(token: string): Socket {
  if (socket && socketToken === token) return socket;
  closeSocket(); // token changed (re-login as another user)
  socket = io(resolveApiUrl(), {
    transports: ['websocket'],
    auth: { token },
  });
  socketToken = token;
  if (import.meta.env.DEV) {
    socket.on('connect', () => console.info('[socket] connected'));
    socket.on('disconnect', (reason) => console.info('[socket] disconnected:', reason));
  }
  socket.on('connect_error', (err) => console.warn('[socket] connect error:', err.message));
  return socket;
}

interface UseSocketOptions {
  /** "Ko'rish" action on the new-lead toast */
  onOpenLead?: (lead: Pick<Lead, 'id'>) => void;
}

/**
 * Connects after login (reacts to the token in the store, not only on mount) and
 * disconnects on logout. Returns the current socket (or null while logged out).
 */
export const useSocket = ({ onOpenLead }: UseSocketOptions = {}) => {
  const queryClient = useQueryClient();
  const token = useStore((s) => (s.isAuthenticated ? s.token : null));
  const role = useStore((s) => s.currentUser?.role);
  const [current, setCurrent] = useState<Socket | null>(() => (token ? socket : null));
  const onOpenLeadRef = useRef(onOpenLead);
  onOpenLeadRef.current = onOpenLead;

  useEffect(() => {
    if (!token) {
      closeSocket();
      setCurrent(null);
      return;
    }

    const s = ensureSocket(token);
    setCurrent(s);

    const handleNewLead = (lead: Pick<Lead, 'id' | 'name' | 'phone'>) => {
      if (!can(role, 'leads.read')) return;
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.info(`Yangi murojaat: ${lead.name}`, {
        description: lead.phone,
        action: {
          label: "Ko'rish",
          onClick: () => onOpenLeadRef.current?.(lead),
        },
      });
    };

    s.on('newLead', handleNewLead);

    return () => {
      s.off('newLead', handleNewLead);
    };
  }, [queryClient, token, role]);

  return current;
};
