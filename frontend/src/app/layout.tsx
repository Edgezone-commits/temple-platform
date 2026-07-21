import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shree Laxminarayan Mandir — Hetauda, Nepal',
  description: 'Official website of Shree Laxminarayan Mandir, Hetauda. Sri Vaishnava Totadri tradition.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}