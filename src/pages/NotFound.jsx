import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, MoveLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px'
    }}>
      <div className="aura-container" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: -1 }}>
         <div className="aura-void" style={{ width: '400px', height: '400px' }}></div>
      </div>

      <div className="rainbow-logo-container" style={{ width: '120px', height: '120px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <Compass size={60} color="white" strokeWidth={1} style={{ animation: 'spin-slow 20s infinite linear' }} />
      </div>

      <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '16px', color: 'var(--text-primary)' }}>
        Lost in the Corridor
      </h1>
      <p style={{ maxWidth: '400px', fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
        The fragment you are looking for has drifted into the void. It either never existed or was deleted from the hallucination.
      </p>

      <button 
        onClick={() => navigate('/')}
        className="exotic-gradient hover-scale" 
        style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '16px 32px', 
            borderRadius: '20px', 
            color: 'white', 
            fontWeight: 'bold',
            border: 'none',
            fontSize: '15px'
        }}
      >
        <MoveLeft size={20} />
        RETURN TO THE LIGHT
      </button>
    </div>
  );
};

export default NotFound;
