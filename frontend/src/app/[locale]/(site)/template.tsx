/**
 * Re-mounts on every navigation (unlike layout.tsx), so its CSS animation
 * gives each public page — including the EN ⇄ नेपाली switch — a soft fade-in.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
