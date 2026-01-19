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
  createSession: (session: Omit<NetSession, 'id' | 'status' | 'dateTime' | 'endTime' | 'lastAcknowledgedEntryId'>) => void;
  openSession: () => void;
  closeSession: () => void;
  loadSession: (id: string) => Promise<void>;

  // Participant actions
  addParticipant: (participant: Omit<Participant, 'id' | 'checkInTime' | 'checkInNumber'>) => void;
  getDisplayCallsign: (callsign: string) => string;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Pick<Participant, 'callsign' | 'tacticalCall' | 'name' | 'location'>) => void;

  // Log entry actions
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'entryNumber' | 'time'>) => void;
  setLastAcknowledgedEntry: (entryId: string) => void;

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
      endTime: null,
      status: 'pending',
      lastAcknowledgedEntryId: null,
    };
    const netControlParticipant: Participant = {
      id: uuidv4(),
      callsign: sessionData.netControlOp,
      tacticalCall: 'NET',
      name: sessionData.netControlName,
      location: '',
      checkInTime: new Date().toISOString(),
      checkInNumber: 1,
    };
    set({
      session,
      participants: [netControlParticipant],
      logEntries: [],
      startTime: null,
      error: null
    });

    invoke('save_session', { session }).catch((err) => {
      set({ error: `Failed to save session: ${err}` });
    });
    invoke('save_participant', { sessionId: session.id, participant: netControlParticipant }).catch((err) => {
      set({ error: `Failed to save net control participant: ${err}` });
    });
  },

  openSession: () => {
    const { session } = get();
    if (session && session.status === 'pending') {
      const activeSession = { ...session, status: 'active' as const, endTime: null };
      set({ session: activeSession, startTime: Date.now() });
      invoke('save_session', { session: activeSession }).catch((err) => {
        set({ error: `Failed to open session: ${err}` });
      });
    }
  },

  closeSession: () => {
    const { session } = get();
    if (session) {
      const closedSession = {
        ...session,
        status: 'closed' as const,
        endTime: new Date().toISOString(),
      };
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

    if (session?.status === 'active') {
      get().addLogEntry({
        fromCallsign: participant.callsign,
        toCallsign: 'NC',
        message: 'check in',
      });
    }
  },

  removeParticipant: (id) => {
    const { participants } = get();
    set({ participants: participants.filter((p) => p.id !== id) });
  },

  updateParticipant: (id, updates) => {
    const { participants, logEntries, session } = get();
    const participant = participants.find((p) => p.id === id);
    if (!participant) return;

    const normalizedUpdates = {
      callsign: updates.callsign.trim().toUpperCase(),
      tacticalCall: updates.tacticalCall.trim(),
      name: updates.name.trim(),
      location: updates.location.trim(),
    };

    const updatedParticipant: Participant = {
      ...participant,
      ...normalizedUpdates,
    };

    const updatedParticipants = participants.map((p) => (p.id === id ? updatedParticipant : p));

    const oldCallsign = participant.callsign;
    const oldTactical = participant.tacticalCall;
    const newCallsign = updatedParticipant.callsign;
    const newTactical = updatedParticipant.tacticalCall;
    const fallbackCallsign = newTactical || newCallsign;

    const entriesToPersist: LogEntry[] = [];
    const updatedEntries = logEntries.map((entry) => {
      const fromCallsign =
        entry.fromCallsign === oldCallsign
          ? newCallsign
          : oldTactical && entry.fromCallsign === oldTactical
            ? fallbackCallsign
            : entry.fromCallsign;
      const toCallsign =
        entry.toCallsign === oldCallsign
          ? newCallsign
          : oldTactical && entry.toCallsign === oldTactical
            ? fallbackCallsign
            : entry.toCallsign;
      if (fromCallsign === entry.fromCallsign && toCallsign === entry.toCallsign) {
        return entry;
      }
      const updatedEntry = { ...entry, fromCallsign, toCallsign };
      entriesToPersist.push(updatedEntry);
      return updatedEntry;
    });

    set({ participants: updatedParticipants, logEntries: updatedEntries });

    if (session) {
      invoke('save_participant', { sessionId: session.id, participant: updatedParticipant }).catch((err) => {
        set({ error: `Failed to save participant: ${err}` });
      });
      for (const entry of entriesToPersist) {
        invoke('save_log_entry', { sessionId: session.id, entry }).catch((err) => {
          set({ error: `Failed to save log entry: ${err}` });
        });
      }
    }
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

  setLastAcknowledgedEntry: (entryId) => {
    const { session } = get();
    if (!session) return;
    const updatedSession: NetSession = {
      ...session,
      lastAcknowledgedEntryId: entryId,
    };
    set({ session: updatedSession });
    invoke('save_session', { session: updatedSession }).catch((err) => {
      set({ error: `Failed to save session: ${err}` });
    });
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
