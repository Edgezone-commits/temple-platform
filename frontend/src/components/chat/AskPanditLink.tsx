'use client';
/** Footer link that opens the "Ask the Pandit" chat widget. */
export default function AskPanditLink({ label }: { label: string }) {
  return (
    <button type="button" className="footer-link as-button" onClick={() => window.dispatchEvent(new Event('pandit:open'))}>
      {label}
    </button>
  );
}
