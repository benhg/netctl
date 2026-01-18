import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import type { NetSession, Participant, LogEntry, CallsignLookupResult } from '../types';

interface NetStore {
  session: NetSession | null;
  participants: Participant[];
  logEntries: LogEntry[];
  isLoading: boolean;
  error: string | null;
  startTime: number | null;

  // Session actions
  createSession: (session: Omit<NetSession, 'id' | 'status' | 'dateTime'>) => void;
  closeSession: () => void;
  loadSession: (id: string) => Promise<void>;

  // Participant actions
  addParticipant: (participant: Omit<Participant, 'id' | 'checkInTime' | 'checkInNumber'>) => void;
  getDisplayCallsign: (callsign: string) => string;
  removeParticipant: (id: string) => void;

  // Log entry actions
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'entryNumber' | 'time'>) => void;

  // Callsign lookup
  lookupCallsign: (callsign: string) => Promise<CallsignLookupResult | null>;

  // Timer
  getElapsedTime: () => number;

  // Export
  exportToCsv: () => string;

  // Reset
  reset: () => void;
}

export const useNetStore = create<NetStore>((set, get) => ({
  session: null,
  participants: [],
  logEntries: [],
  isLoading: false,
  error: null,
  startTime: null,

  createSession: (sessionData) => {
    const session: NetSession = {
      id: uuidv4(),
      ...sessionData,
      dateTime: new Date().toISOString(),
      status: 'active',
    };
    set({
      session,
      participants: [],
      logEntries: [],
      startTime: Date.now(),
      error: null
    });

    invoke('save_session', { session }).catch((err) => {
      set({ error: `Failed to save session: ${err}` });
    });
  },

  closeSession: () => {
    const { session } = get();
    if (session) {
      const closedSession = { ...session, status: 'closed' as const };
      set({ session: closedSession, startTime: null });
      invoke('save_session', { session: closedSession }).catch((err) => {
        set({ error: `Failed to close session: ${err}` });
      });
    }
  },

  loadSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await invoke<{
        session: NetSession;
        participants: Participant[];
        logEntries: LogEntry[];
      }>('load_session', { id });
      set({
        session: data.session,
        participants: data.participants,
        logEntries: data.logEntries,
        startTime: data.session.status === 'active' ? new Date(data.session.dateTime).getTime() : null,
        isLoading: false,
      });
    } catch (err) {
      set({ error: `Failed to load session: ${err}`, isLoading: false });
    }
  },

  addParticipant: (participantData) => {
    const { participants, session } = get();
    const participant: Participant = {
      id: uuidv4(),
      ...participantData,
      checkInTime: new Date().toISOString(),
      checkInNumber: participants.length + 1,
    };
    const newParticipants = [...participants, participant];
    set({ participants: newParticipants });

    if (session) {
      invoke('save_participant', { sessionId: session.id, participant }).catch((err) => {
        set({ error: `Failed to save participant: ${err}` });
      });
    }
  },

  removeParticipant: (id) => {
    const { participants } = get();
    set({ participants: participants.filter((p) => p.id !== id) });
  },

  getDisplayCallsign: (callsign) => {
    const { participants } = get();
    const participant = participants.find(p => p.callsign === callsign);
    if (participant?.tacticalCall) {
      return `${participant.tacticalCall} (${callsign})`;
    }
    return callsign;
  },

  addLogEntry: (entryData) => {
    const { logEntries, session } = get();
    const entry: LogEntry = {
      id: uuidv4(),
      ...entryData,
      time: new Date().toISOString(),
      entryNumber: logEntries.length + 1,
    };
    const newEntries = [...logEntries, entry];
    set({ logEntries: newEntries });

    if (session) {
      invoke('save_log_entry', { sessionId: session.id, entry }).catch((err) => {
        set({ error: `Failed to save log entry: ${err}` });
      });
    }
  },

  lookupCallsign: async (callsign) => {
    try {
      const result = await invoke<CallsignLookupResult | null>('lookup_callsign', {
        callsign: callsign.toUpperCase()
      });
      return result;
    } catch (err) {
      console.error('Callsign lookup failed:', err);
      return null;
    }
  },

  getElapsedTime: () => {
    const { startTime } = get();
    if (!startTime) return 0;
    return Date.now() - startTime;
  },

  exportToCsv: () => {
    const { session, participants, logEntries } = get();
    if (!session) return '';

    const lines: string[] = [];
    lines.push('ICS 309 Communications Log');
    lines.push(`Net Name,${session.name}`);
    lines.push(`Frequency,${session.frequency}`);
    lines.push(`Net Control,${session.netControlOp} - ${session.netControlName}`);
    lines.push(`Date/Time,${session.dateTime}`);
    lines.push('');
    lines.push('Participants');
    lines.push('Check-In #,Callsign,Tactical,Name,Location,Time');
    for (const p of participants) {
      lines.push(`${p.checkInNumber},${p.callsign},${p.tacticalCall || ''},${p.name},${p.location},${p.checkInTime}`);
    }
    lines.push('');
    lines.push('Communications Log');
    lines.push('Entry #,Time,From,To,Message');
    for (const e of logEntries) {
      lines.push(`${e.entryNumber},${e.time},${e.fromCallsign},${e.toCallsign},"${e.message.replace(/"/g, '""')}"`);
    }

    return lines.join('\n');
  },

  reset: () => {
    set({
      session: null,
      participants: [],
      logEntries: [],
      isLoading: false,
      error: null,
      startTime: null,
    });
  },
}));
