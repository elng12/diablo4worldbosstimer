'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0b0d12',
      color: '#e4e4e7',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>Something Went Wrong</h1>
      <p style={{ marginBottom: '1.5rem', color: '#a1a1aa' }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          color: '#0b0d12',
          backgroundColor: '#fbbf24',
          border: 'none',
          borderRadius: '6px',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </main>
  );
}
