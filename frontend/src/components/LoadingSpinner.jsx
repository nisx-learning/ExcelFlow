export default function LoadingSpinner({ message = '加载中...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: '#fff',
    }}>
      <svg
        style={{
          animation: 'spin 1s linear infinite',
        }}
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#495057"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ marginTop: '16px', color: '#495057', fontSize: '14px' }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
