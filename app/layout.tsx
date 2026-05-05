import type { Metadata } from 'next';
import '@/components/world-boss/world-boss.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
  ),
  title: {
    default: 'Diablo 4 World Boss Timer',
    template: '%s',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
