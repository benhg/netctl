import { useState, useEffect } from 'react';
import { useNetStore } from '../stores/netStore';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function Header() {
  const { session, getElapsedTime, closeSession } = useNetStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (session?.status === 'active') {
      const interval = setInterval(() => {
        setElapsed(getElapsedTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session?.status, getElapsedTime]);

  if (!session) {
    return (
      <header className="bg-slate-800 text-white p-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold">Net Control</h1>
        <p className="text-slate-400 text-sm">Create a new session to get started</p>
      </header>
    );
  }

  return (
    <header className="bg-slate-800 text-white p-4 border-b border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{session.name}</h1>
          <div className="flex gap-4 text-sm text-slate-300 mt-1">
            <span>{session.frequency}</span>
            <span>|</span>
            <span>NCS: {session.netControlOp} ({session.netControlName})</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-3">
            {session.status === 'active' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-400 text-sm font-medium">ACTIVE</span>
                </div>
                <button
                  onClick={closeSession}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  Close Net
                </button>
              </>
            ) : (
              <span className="text-slate-400 text-sm font-medium">CLOSED</span>
            )}
          </div>
          <div className="text-3xl font-mono mt-2">{formatDuration(elapsed)}</div>
          <div className="text-xs text-slate-400">
            Started: {new Date(session.dateTime).toLocaleString()}
          </div>
        </div>
      </div>
    </header>
  );
}
