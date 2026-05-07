'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="wb-error-page">
      <h1 className="wb-error-heading-danger">Something Went Wrong</h1>
      <p>An unexpected error occurred. Please try again.</p>
      <button className="wb-error-btn" onClick={reset}>
        Try Again
      </button>
    </main>
  );
}
