import type { Metadata } from 'next';
import '@/components/world-boss-admin/world-boss-admin.css';
import { AdminWorldBossPage } from '@/components/world-boss-admin/AdminWorldBossPage';

export const metadata: Metadata = {
  title: 'Admin — World Boss',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminWorldBossPage />;
}
