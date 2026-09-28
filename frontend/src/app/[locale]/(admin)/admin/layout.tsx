/**
 * /[locale]/admin/* — admin-only area.
 * The proxy already sends anonymous visitors to /login; here we also check
 * profiles.role === 'admin' (devotees are sent back to the home page).
 * Uses its own clean dashboard chrome instead of the ornate site header.
 */
import { setRequestLocale } from 'next-intl/server';
import AdminShell from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/admin/api';

export default async function AdminLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const account = await requireAdmin(locale);
  return <AdminShell name={account.name}>{children}</AdminShell>;
}
