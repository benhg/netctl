import { save } from '@tauri-apps/plugin-dialog';
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { useNetStore } from '../stores/netStore';
import { generateICS309PDF } from '../lib/pdfExport';

export function ExportButtons() {
  const { session, participants, logEntries, exportToCsv } = useNetStore();

  const handleExportCsv = async () => {
    if (!session) return;

    const csv = exportToCsv();
    const path = await save({
      defaultPath: `${session.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (path) {
      await writeTextFile(path, csv);
    }
  };

  const handleExportPdf = async () => {
    if (!session) return;

    try {
      const pdfBytes = await generateICS309PDF(session, participants, logEntries);

      const path = await save({
        defaultPath: `ICS309_${session.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (path) {
        await writeFile(path, pdfBytes);
      }
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  if (!session) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportCsv}
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
      >
        Export CSV
      </button>
      <button
        onClick={handleExportPdf}
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
      >
        Export PDF
      </button>
    </div>
  );
}
