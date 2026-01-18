import { useNetStore } from '../stores/netStore';

export function CommunicationLog() {
  const { logEntries } = useNetStore();

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex-1 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-white">Communications Log</h2>
        <span className="text-sm text-slate-400">{logEntries.length} entries</span>
      </div>
      {logEntries.length === 0 ? (
        <p className="text-slate-400 text-sm">No log entries yet</p>
      ) : (
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-2 w-12">#</th>
                <th className="pb-2 pr-2 w-20">Time</th>
                <th className="pb-2 pr-2 w-24">From</th>
                <th className="pb-2 pr-2 w-24">To</th>
                <th className="pb-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {logEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-2 pr-2 text-slate-500">{entry.entryNumber}</td>
                  <td className="py-2 pr-2 font-mono text-slate-300">{formatTime(entry.time)}</td>
                  <td className="py-2 pr-2 font-mono text-blue-400">{entry.fromCallsign}</td>
                  <td className="py-2 pr-2 font-mono text-green-400">{entry.toCallsign}</td>
                  <td className="py-2 text-white">{entry.message || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
