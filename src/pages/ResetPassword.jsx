import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase fills the session automatically when redirected from recovery email
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsValidSession(true);
        } else {
            setError("Recovery session expired or invalid. Please request a new link.");
        }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Identities do not match.");
    }
    if (password.length < 6) {
      return setError("Identity Key must be at least 6 characters.");
    }

    setLoading(true);
    setError('');
    
    const res = await updatePassword(password);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#020617' }}>
      <div className="exotic-gradient" style={{ position: 'absolute', inset: -150, zIndex: -1, opacity: 0.15, filter: 'blur(120px)' }}></div>
      
      <div className="fade-in" style={{ width: '100%', maxWidth: '420px', padding: '48px', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(40px)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
         
         <div className="rainbow-logo-container" style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', backgroundColor: 'var(--accent-color)', color: 'white' }}>
            {success ? <ShieldCheck size={36} /> : <Zap size={36} fill="currentColor" />}
         </div>
         
         <h1 style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Space Grotesk', marginBottom: '12px', letterSpacing: '-1px', color: 'white', textAlign: 'center' }}>
            {success ? 'Identity Secured' : 'Reset Identity Key'}
         </h1>
         
         {!success ? (
           <>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: '1.6', textAlign: 'center', marginBottom: '32px' }}>
                Establish a new security fragment for your Hallway connection.
              </p>

              <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input 
                    type="password" 
                    placeholder="New Identity Key" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    style={{ padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '15px' }} 
                    disabled={!isValidSession}
                    required 
                  />
                  <input 
                    type="password" 
                    placeholder="Confirm New Key" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    style={{ padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '15px' }} 
                    disabled={!isValidSession}
                    required 
                  />
                  
                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', justifyContent: 'center', marginTop: '8px' }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || !isValidSession} 
                    className="exotic-gradient" 
                    style={{ padding: '18px', borderRadius: 'var(--radius-lg)', color: 'white', fontWeight: 'black', fontSize: '16px', marginTop: '12px', border: 'none', cursor: (loading || !isValidSession) ? 'not-allowed' : 'pointer', boxShadow: '0 20px 40px rgba(99,102,241,0.3)', opacity: (loading || !isValidSession) ? 0.7 : 1 }}
                  >
                      {loading ? 'REPROGRAMMING...' : 'UPDATE IDENTITY KEY'}
                  </button>
              </form>
           </>
         ) : (
           <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '16px' }}>
                Success! Redirecting you to the Hallway...
              </p>
           </div>
         )}

         {!isValidSession && !loading && !success && (
            <button 
              onClick={() => navigate('/')} 
              style={{ marginTop: '24px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Return to Login
            </button>
         )}
      </div>
    </div>
  );
};

export default ResetPassword;
