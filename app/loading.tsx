export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAF9',
        zIndex: 9000,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '2px solid #d6d3d1',
            borderTopColor: '#1c1917',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1.5rem',
          }}
        />
        <p
          style={{
            color: '#a8a29e',
            fontSize: '0.875rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Loading
        </p>
      </div>
    </div>
  );
}
