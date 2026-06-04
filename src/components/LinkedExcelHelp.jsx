export default function LinkedExcelHelp({ linkSupported }) {
  return (
    <details className="mx-auto mt-4 max-w-xl rounded-xl border border-[#1e2740]/80 bg-[#111520]/60 px-4 py-3 text-left text-[11px] text-[#6b7a9e] sm:text-xs">
      <summary className="cursor-pointer font-semibold text-[#e8ecf5]">
        How to link Excel for auto-sync (step by step)
      </summary>
      <ol className="mt-3 list-decimal space-y-2 pl-4">
        <li>
          Use <strong className="text-[#e8ecf5]">Chrome</strong> or{' '}
          <strong className="text-[#e8ecf5]">Edge</strong> on a computer (Link Excel is not
          available in all mobile browsers).
        </li>
        <li>
          Click <strong className="text-[#3b82f6]">Link Excel</strong> next to Upload and choose
          your workbook (e.g. <strong className="text-[#f7c948]">Rap_1.xlsx</strong>).
        </li>
        <li>
          Allow read access when the browser asks — this is required to read the file when you
          save it.
        </li>
        <li>
          Edit the file in Excel as usual. Press <strong className="text-[#e8ecf5]">Ctrl+S</strong>{' '}
          to save — the dashboard checks every 45 seconds and when you return to this tab.
        </li>
        <li>
          Watch <strong className="text-[#10b981]">Last synced</strong> under the header; it
          updates after each successful read.
        </li>
        <li>
          <strong className="text-[#e8ecf5]">Upload Excel</strong> still works anytime for a
          one-time import (no link needed).
        </li>
        <li>
          Click <strong className="text-[#6b7a9e]">Unlink</strong> to stop auto-sync. Your saved
          dashboard data stays until you upload again.
        </li>
      </ol>
      {!linkSupported && (
        <p className="mt-3 rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-2 text-[#f97316]">
          This browser does not support Link Excel — use Upload Excel instead.
        </p>
      )}
      <p className="mt-3 text-[10px] leading-relaxed">
        Tip: Keep the same file path after linking. If Excel locks the file briefly, sync retries
        on the next check.
      </p>
    </details>
  );
}
