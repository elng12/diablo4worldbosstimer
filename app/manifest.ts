import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Diablo 4 World Boss Timer',
    short_name: 'D4 Boss Timer',
    description: 'Track Diablo 4 world boss spawn times, locations, and get reminders',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0d12',
    theme_color: '#0b0d12',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
