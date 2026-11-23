import React, { useState } from 'react';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { validateUsername, validatePassword, validateEmail, friendlyAuthError } from '../lib/validation';

const Login = () => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      let res;

      if (mode === 'login') {
        const emailCheck = validateEmail(email);
        if (!emailCheck.valid) { setError(emailCheck.message); return; }
        res = await login(email, password);
      } else if (mode === 'signup') {
        // Validate everything locally first, so a first-time user gets a
        // clear message instead of a database error.
        const emailCheck = validateEmail(email);
        if (!emailCheck.valid) { setError(emailCheck.message); return; }

        const passCheck = validatePassword(password);
        if (!passCheck.valid) { setError(passCheck.message); return; }

        const nameCheck = validateUsername(username);
        if (!nameCheck.valid) { setError(nameCheck.message); return; }

        res = await signup(email, password, username, fullName);
      } else if (mode === 'forgot') {
        const emailCheck = validateEmail(email);
        if (!emailCheck.valid) { setError(emailCheck.message); return; }
        res = await resetPassword(email);
        if (res.success) setMessage('Recovery link sent to your digital corridor (email).');
      }

      if (res && !res.success) setError(res.message || friendlyAuthError({}));
    } catch (err) {
      setError(friendlyAuthError(err) || "An unexpected connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes textShine {
            0% { background-position: 0% 50%; border-color: rgba(255,0,122,0.2); box-shadow: 0 0 40px rgba(255,0,122,0.1); }
            50% { background-position: 100% 50%; border-color: rgba(0,242,255,0.4); box-shadow: 0 0 80px rgba(0,242,255,0.2); }
            100% { background-position: 0% 50%; border-color: rgba(255,0,122,0.2); box-shadow: 0 0 40px rgba(255,0,122,0.1); }
          }
          .mega-cyber-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: clamp(48px, 8vw, 84px);
            font-weight: 900;
            letter-spacing: -2px;
            text-transform: uppercase;
            background: linear-gradient(135deg, #FF007A 0%, #7928CA 50%, #00F2FF 100%);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: textShine 6s ease infinite;
            margin-bottom: 8px;
            position: relative;
            line-height: 1;
            padding-bottom: 4px;
          }
          .mega-cyber-title::after {
            content: "HALLWAYS";
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #FF007A 0%, #7928CA 50%, #00F2FF 100%);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: blur(24px);
            opacity: 0.6;
            z-index: -1;
            animation: textShine 6s ease infinite;
          }
          .floating-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.4;
            animation: orbFloat 20s infinite alternate ease-in-out;
            z-index: 0;
            pointer-events: none;
          }
          @keyframes orbFloat {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(100px, -100px) scale(1.5); }
          }
        `}
      </style>

      {/* AMBIENT BACKGROUND */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', minHeight: '100vh', position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'auto', backgroundColor: '#020617', padding: '40px 20px' }}>
        
        {/* Animated Orbs */}
        <div className="floating-orb" style={{ width: '400px', height: '400px', background: '#7928CA', top: '-10%', left: '10%', animationDelay: '0s' }}></div>
        <div className="floating-orb" style={{ width: '600px', height: '600px', background: '#FF007A', bottom: '-20%', right: '5%', animationDelay: '-10s' }}></div>
        <div className="floating-orb" style={{ width: '300px', height: '300px', background: '#00F2FF', top: '40%', left: '-10%', animationDelay: '-5s' }}></div>

        {/* LOGO & TITLE */}
        <div className="fade-in-up" style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div className="story-ring" style={{ width: '80px', height: '80px', marginBottom: '24px', animation: 'textShine 8s linear infinite', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap fill="white" size={40} color="white" />
            </div>
            <h1 className="mega-cyber-title" style={{ textAlign: 'center' }}>Hallways</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: '800' }}>
               {mode === 'login' ? 'The Social Network' : mode === 'signup' ? 'Create Account' : 'Restore Access'}
            </p>
        </div>

        {/* GLASS CARD */}
        <div className="fade-in" style={{ width: '100%', maxWidth: '440px', padding: '48px 40px', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(60px)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', animation: 'textShine 6s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
           
           <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'signup' && (
                <>
                  <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ padding: '18px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'white', outline: 'none', fontSize: '15px', transition: 'all 0.3s' }} className="focus-ring" required />
                  <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: '18px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'white', outline: 'none', fontSize: '15px', transition: 'all 0.3s' }} className="focus-ring" required />
                </>
              )}
              <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '18px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'white', outline: 'none', fontSize: '15px', transition: 'all 0.3s' }} className="focus-ring" required />
              
              {mode !== 'forgot' && (
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Key Phrase (Password)" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '18px 52px 18px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'white', outline: 'none', fontSize: '15px', transition: 'all 0.3s' }} className="focus-ring" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s', padding: '4px', display: 'flex' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}
              
              {error && <p style={{ color: '#ff007a', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', marginTop: '4px', textShadow: '0 0 10px rgba(255,0,122,0.5)' }}>{error}</p>}
              {message && <p style={{ color: '#00f2ff', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', marginTop: '4px', textShadow: '0 0 10px rgba(0,242,255,0.5)' }}>{message}</p>}

               <button type="submit" disabled={loading} style={{ padding: '18px', borderRadius: '16px', fontWeight: '900', fontSize: '16px', marginTop: '16px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'white', color: 'black', boxShadow: '0 10px 30px rgba(255,255,255,0.2)', transition: 'all 0.3s', opacity: loading ? 0.7 : 1 }} className="hover-scale">
                  {loading ? 'AUTHENTICATING...' : (mode === 'login' ? 'ENTER HALLWAYS' : mode === 'signup' ? 'JOIN NETWORK' : 'RECOVER ACCOUNT')}
               </button>

               {mode === 'login' && (
                 <p onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center', cursor: 'pointer', marginTop: '12px' }} className="hover-underline">
                   Forgot your password?
                 </p>
               )}
           </form>

           <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
              <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', letterSpacing: '2px' }}>{mode === 'forgot' ? 'BACK' : 'OR'}</span>
              <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
           </div>

           <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '600' }}>
              {mode === 'login' ? "First time in the network? " : "Already established? "}
              
              <span onClick={() => { 
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(''); setMessage('');
              }} style={{ color: 'white', fontWeight: '900', cursor: 'pointer', textDecoration: 'none' }} className="hover-underline">
                 {mode === 'login' ? 'Register Identity' : 'Log In'}
              </span>
           </p>
        </div>

        {/* PROFESSIONAL FOOTER HUB */}
        <div style={{ marginTop: 'auto', paddingTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', opacity: 0.6, zIndex: 1 }}>
           <div style={{ display: 'flex', gap: '32px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' }}>
              <Link to="/help/about" style={{ color: 'white', textDecoration: 'none' }} className="hover-bright">ABOUT</Link>
              <Link to="/help/help" style={{ color: 'white', textDecoration: 'none' }} className="hover-bright">SUPPORT</Link>
              <Link to="/help/privacy" style={{ color: 'white', textDecoration: 'none' }} className="hover-bright">PRIVACY</Link>
           </div>
           <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', letterSpacing: '6px' }}>
              HALLWAYS SOCIAL V2 2026
           </div>
        </div>
      </div>
    </>
  );
};

export default Login;

