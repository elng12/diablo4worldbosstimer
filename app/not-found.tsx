export default function NotFound() {
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fbbf24' }}>Page Not Found</h1>
      <p style={{ marginBottom: '1.5rem', color: '#a1a1aa' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a
        href="/"
        style={{
          color: '#fbbf24',
          textDecoration: 'underline',
          fontSize: '1.125rem',
        }}
      >
        Go to World Boss Timer
      </a>
    </main>
  );
}
