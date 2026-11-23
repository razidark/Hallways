import React, { useEffect } from 'react';

const SplashScreen = () => {
  const [phase, setPhase] = React.useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes splash-morph {
          0% { border-radius: 40px; transform: rotate(0deg) scale(0.6); }
          25% { border-radius: 50%; transform: rotate(90deg) scale(1.1); }
          50% { border-radius: 30px; transform: rotate(180deg) scale(1); }
          75% { border-radius: 50%; transform: rotate(270deg) scale(1.05); }
          100% { border-radius: 40px; transform: rotate(360deg) scale(1); }
        }
        @keyframes splash-glow-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 50px rgba(168,85,247,0.5), 0 0 100px rgba(168,85,247,0.2); }
        }
        @keyframes splash-text-reveal {
          from { opacity: 0; transform: translateY(12px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes splash-bar-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes splash-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .splash-logo-container {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: splash-morph 6s infinite ease-in-out, splash-glow-pulse 3s infinite ease-in-out;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15), rgba(236,72,153,0.15));
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }
        .splash-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(99,102,241,0.6);
          border-right-color: rgba(168,85,247,0.3);
          animation: splash-ring-spin 2s linear infinite;
        }
        .splash-ring-outer {
          position: absolute;
          inset: -16px;
          border-radius: 50%;
          border: 1px solid transparent;
          border-bottom-color: rgba(236,72,153,0.4);
          border-left-color: rgba(99,102,241,0.2);
          animation: splash-ring-spin 3s linear infinite reverse;
        }
      `}</style>

      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: '36px',
        overflow: 'hidden'
      }}>
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: '#6366f1', filter: 'blur(120px)', opacity: 0.15, top: '10%', left: '20%' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: '#a855f7', filter: 'blur(120px)', opacity: 0.1, bottom: '10%', right: '15%' }} />

        {/* Morphing Logo */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.6s cubic-bezier(0.19, 1, 0.22, 1)'
        }}>
          <div className="splash-logo-container">
            <div className="splash-ring" />
            <div className="splash-ring-outer" />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Brand Text */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '8px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
            filter: phase >= 2 ? 'blur(0) drop-shadow(0 0 10px rgba(99,102,241,0.4))' : 'blur(8px)',
            transition: 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
          }}>
            HALLWAYS
          </h1>
          <p style={{
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '4px',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.6s cubic-bezier(0.19, 1, 0.22, 1) 0.1s',
          }}>
            SOCIAL NETWORK
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '80px',
          height: '2px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.4s'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
            borderRadius: 'var(--radius-sm)',
            animation: phase >= 2 ? 'splash-bar-fill 1.2s ease-out forwards' : 'none'
          }} />
        </div>

        {/* Version Tag */}
        <p style={{
          position: 'absolute',
          bottom: '36px',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '3px',
          color: 'rgba(255,255,255,0.15)',
          opacity: phase >= 3 ? 1 : 0,
          transition: 'opacity 0.5s'
        }}>
          BETA v2.0 · ENCRYPTED
        </p>
      </div>
    </>
  );
};

export default SplashScreen;
