import { useState } from 'react';
import { useNetStore } from '../stores/netStore';
import type { Participant } from '../types';

interface ParticipantListProps {
  onSelectParticipant: (participant: Participant) => void;
}

export function ParticipantList({ onSelectParticipant }: ParticipantListProps) {
  const { participants, logEntries, removeParticipant, session, updateParticipant } = useNetStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    callsign: '',
    tacticalCall: '',
    name: '',
    location: '',
  });

  const getLastTransmission = (callsign: string): string | null => {
    const entries = logEntries.filter(
      (e) => e.fromCallsign === callsign || e.toCallsign === callsign
    );
    if (entries.length === 0) return null;
    const last = entries[entries.length - 1];
    return new Date(last.time).toLocaleTimeString();
  };

  if (participants.length === 0) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-3">Checked In Stations</h2>
        <p className="text-slate-400 text-sm">No stations checked in yet</p>
      </div>
    );
  }

  const startEditing = (participant: Participant) => {
    setEditingId(participant.id);
    setDraft({
      callsign: participant.callsign,
      tacticalCall: participant.tacticalCall || '',
      name: participant.name || '',
      location: participant.location || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSave = (participantId: string) => {
    const normalized = {
      callsign: draft.callsign.trim().toUpperCase(),
      tacticalCall: draft.tacticalCall.trim(),
      name: draft.name.trim(),
      location: draft.location.trim(),
    };
    updateParticipant(participantId, {
      callsign: normalized.callsign,
      tacticalCall: normalized.tacticalCall,
      name: normalized.name,
      location: normalized.location,
    });
    setEditingId(null);
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-white">Checked In Stations</h2>
        <span className="text-sm text-slate-400">{participants.length} stations</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {participants.map((p) => {
          const lastTx = getLastTransmission(p.callsign);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 bg-slate-900 rounded hover:bg-slate-700 transition-colors group"
            >
              {editingId === p.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave(p.id);
                  }}
                  className="flex-1"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-6">#{p.checkInNumber}</span>
                      <input
                        type="text"
                        value={draft.tacticalCall}
                        onChange={(e) => setDraft((prev) => ({ ...prev, tacticalCall: e.target.value }))}
                        placeholder="Tactical"
                        className="w-24 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                      />
                      <input
                        type="text"
                        value={draft.callsign}
                        onChange={(e) => setDraft((prev) => ({ ...prev, callsign: e.target.value }))}
                        placeholder="Callsign"
                        className="w-28 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-blue-200 placeholder-slate-500 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Name"
                        className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                      />
                      <input
                        type="text"
                        value={draft.location}
                        onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Location"
                        className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={!draft.callsign.trim()}
                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    onClick={() => onSelectParticipant(p)}
                    className="flex-1 text-left"
                    disabled={session?.status !== 'active'}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-6">#{p.checkInNumber}</span>
                      {p.tacticalCall && (
                        <span className="font-semibold text-yellow-400">{p.tacticalCall}</span>
                      )}
                      <span className="font-mono text-blue-400 font-semibold">{p.callsign}</span>
                      <span className="text-white">{p.name}</span>
                      <span className="text-slate-400 text-sm">{p.location}</span>
                    </div>
                    {lastTx && (
                      <div className="text-xs text-slate-500 ml-9">Last TX: {lastTx}</div>
                    )}
                  </button>
                  {session?.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(p)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-white text-sm px-2 transition-opacity"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm px-2 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
