import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const size = {
  width: 1200,
  height: 630,
};

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0B0D12',
          color: '#F8FAFC',
          padding: '56px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 18%, rgba(184,50,42,.28), transparent 32%), radial-gradient(circle at 88% 72%, rgba(214,168,79,.18), transparent 30%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: '#A1A1AA',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: '#B8322A',
                boxShadow: '0 0 30px #B8322A',
              }}
            />
            D4 Boss Timer
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #2A2F3A',
              borderRadius: 999,
              padding: '10px 18px',
              color: '#F59E0B',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            Predicted schedule
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 42 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 690 }}>
            <div
              style={{
                color: '#D6A84F',
                fontSize: 30,
                fontWeight: 800,
                marginBottom: 18,
              }}
            >
              Next spawn, local time, locations
            </div>
            <div
              style={{
                fontSize: 78,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              Diablo 4 World Boss Timer
            </div>
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                gap: 16,
                color: '#A1A1AA',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              <span>Live countdown</span>
              <span style={{ color: '#71717A' }}>•</span>
              <span>8 upcoming spawns</span>
            </div>
          </div>
          <div
            style={{
              width: 350,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              border: '1px solid #252B36',
              borderRadius: 8,
              background: '#151922',
              padding: 28,
              boxShadow: '0 28px 80px rgba(0,0,0,.45)',
            }}
          >
            <div style={{ color: '#A1A1AA', fontSize: 24, fontWeight: 700 }}>
              Next World Boss
            </div>
            <div style={{ fontSize: 40, fontWeight: 900 }}>Wandering Death</div>
            <div
              style={{
                color: '#D6A84F',
                fontSize: 60,
                lineHeight: 1,
                fontWeight: 900,
                fontFamily: 'Menlo, monospace',
              }}
            >
              02:30:00
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                color: '#A1A1AA',
                fontSize: 24,
                lineHeight: 1.35,
              }}
            >
              <span>Caen Alderwood</span>
              <span>Scosglen</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
