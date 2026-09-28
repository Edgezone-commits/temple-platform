/** /[locale]/admin/<resource>/new — same screen as edit, with an empty form. */
import ResourceEditPage from '../[id]/page';

export default async function ResourceNewPage({ params }: { params: Promise<{ locale: string; resource: string }> }) {
  const p = await params;
  return ResourceEditPage({ params: Promise.resolve({ ...p, id: 'new' }) });
}
