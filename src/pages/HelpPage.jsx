import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Globe, HelpCircle, Briefcase, FileText, Newspaper, Mail, Terminal, Zap, ExternalLink } from 'lucide-react';

const HELP_CONTENT = {
  about: { 
    title: "About Hallway", 
    tagline: "The Chromatic Connection Agency.",
    icon: <Globe size={24} />, 
    text: "Hallway is a professional social architecture designed to foster high-fidelity human connections in a digital landscape. Built on the principles of transparency and premium design, Hallway transcends traditional feed-based interaction to offer a seamless environment for shared experiences. We believe that digital space should feel alive, translucent, and deeply personalized.",
    details: [
        { title: "Our Mission", text: "To eliminate digital friction and restore the visceral feeling of human presence in software." },
        { title: "The Design Aesthetic", text: "Inspired by holographic light and glassmorphism, our design system reflects the fluid nature of modern identity." },
        { title: "Administrative Security", text: "To protect the social graphs and maintain systemic harmony, authorized administrators display a 'System Overseer' badge (a glowing pink-red shield) and hold key moderation permissions." }
    ]
  },
  help: { 
    title: "Help Center", 
    tagline: "Always synced, always here.",
    icon: <HelpCircle size={24} />, 
    text: "Navigating the platform should be seamless, but we're here if you drift off course. Our support team monitors the network 24/7 to ensure your experience remains stable and inspiring.",
    contact: "Join our official Discord server",
    faq: [
        { q: "How do I change my Profile Frame?", a: "Navigate to your Profile, select 'Edit Profile', and choose from our curated list of styles including Rainbow, Neon, and Geometric frames." },
        { q: "What is Messaging?", a: "Hallway features a high-fidelity direct messaging system with advanced privacy protections." },
        { q: "What is the System Overseer badge?", a: "The System Overseer badge (a glowing crimson shield) identifies the admin accounts responsible for node moderation, structural updates, and corridor safety." }
    ]
  },
  press: { 
    title: "Press & News", 
    tagline: "The pulse of the network.",
    icon: <Newspaper size={24} />, 
    text: "Hallway's launch has set a new standard for digital connection. From our revolutionary vertical reels to our intelligent community briefings, we are redefining what it means to be 'online'.",
    releases: [
        { date: "April 2026", title: "Hallway reaches 1 million active users." },
        { date: "March 2026", title: "Internal design system goes open-source for Google Partners." }
    ]
  },
  api: { 
    title: "Developer API", 
    tagline: "Extend the network.",
    icon: <Terminal size={24} />, 
    text: "The Hallway API allows developers to build custom integrations and professional tools. Our REST and GraphQL endpoints provide high-fidelity access to the Hallway social graph.",
    docs: "Currently in Private Beta. Request access via the Developer Portal."
  },
  jobs: { 
    title: "Careers", 
    tagline: "Build the future platform.",
    icon: <Briefcase size={24} />, 
    text: "Google is looking for visionary designers, engineers, and product specialists to help us evolve Hallway. If you're passionate about glassmorphism and real-time social visualizations, we want to meet you.",
    fields: ["Social Systems Engineering", "Creative UI/UX", "Product Strategy"]
  },
  privacy: { 
    title: "Privacy & Security", 
    tagline: "Your identity, protected.",
    icon: <Shield size={24} />, 
    text: "Privacy isn't an option; it's the foundation of the corridor. Your data is protected by Google's industry-leading security infrastructure, featuring multi-layered encryption and decentralized identity management.",
    points: ["Zero-knowledge message indexing", "Granular data visibility controls", "No third-party data monetization"]
  },
  terms: { 
    title: "Terms of Service", 
    tagline: "Conduct in the corridor.",
    icon: <FileText size={24} />, 
    text: "By entering the Hallway, you agree to uphold our community standards of respect, creativity, and authenticity. We maintain a zero-tolerance policy for harassment or interference within the network.",
    update: "Last updated: April 9, 2026"
  }
};

const HelpPage = () => {
  const { topic } = useParams();
  const navigate = useNavigate();
  const activeTopic = topic?.toLowerCase() || 'help';
  const content = HELP_CONTENT[activeTopic] || HELP_CONTENT.help;

  return (
    <div className="fade-in" style={{ height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', backgroundColor: 'var(--bg-primary)' }}>
       {/* Support Sidebar */}
       <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '40px 24px', display: 'flex', flexDirection: 'column' }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', cursor: 'pointer' }} className="hover-scale">
             <div className="rainbow-logo-container" style={{ width: '32px', height: '32px', borderRadius: '10px' }}>
                <Zap size={18} color="white" fill="white" />
             </div>
             <span style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '2px' }}>HALLWAY</span>
          </div>

          <h4 style={{ fontSize: '10px', fontWeight: '900', opacity: 0.4, letterSpacing: '2px', marginBottom: '24px' }}>NAVIGATION</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {Object.keys(HELP_CONTENT).map(key => (
                <Link 
                    key={key} 
                    to={`/help/${key}`} 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '12px 16px', 
                        borderRadius: '16px', 
                        textDecoration: 'none', 
                        color: activeTopic === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                        backgroundColor: activeTopic === key ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent',
                        fontWeight: activeTopic === key ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }} 
                    className="hover-bg"
                >
                   <span style={{ opacity: activeTopic === key ? 1 : 0.5 }}>{HELP_CONTENT[key].icon}</span>
                   <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{key}</span>
                </Link>
             ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '24px', borderRadius: '24px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Need direct help?</p>
              <button onClick={() => window.open('https://discord.gg/mHSxUjzXnc', '_blank')} style={{ width: '100%', padding: '10px', borderRadius: '12px', backgroundColor: '#5865F2', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>JOIN DISCORD</button>
          </div>
       </div>

       {/* Main Content Area */}
       <div style={{ flex: 1, overflowY: 'auto', padding: '80px 100px' }}>
          <div style={{ maxWidth: '800px' }}>
             <p className="rainbow-text" style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', marginBottom: '16px' }}>GOOGLE HALLWAY / {activeTopic.toUpperCase()}</p>
             <h1 style={{ fontSize: '64px', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-3px', lineHeight: 0.9, marginBottom: '24px' }}>{content.title}</h1>
             <p style={{ fontSize: '20px', color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '40px' }}>{content.tagline}</p>
             
             <div style={{ padding: '40px', borderRadius: '32px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', marginBottom: '48px' }}>
                <p style={{ fontSize: '18px', lineHeight: '1.8', opacity: 0.8 }}>{content.text}</p>
             </div>

             {/* Dynamic Content Sections */}
             {activeTopic === 'about' && content.details.map(d => (
                <div key={d.title} style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>{d.title}</h3>
                    <p style={{ opacity: 0.6, lineHeight: '1.6' }}>{d.text}</p>
                </div>
             ))}

             {activeTopic === 'help' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-tertiary)' }}>
                            <Mail size={24} color="var(--accent-color)" style={{ marginBottom: '16px' }} />
                            <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Discord Support</h4>
                            <p style={{ fontSize: '13px', opacity: 0.6 }}>{content.contact}</p>
                        </div>
                        <div style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-tertiary)' }}>
                            <ExternalLink size={24} color="var(--accent-color)" style={{ marginBottom: '16px' }} />
                            <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Developer Hub</h4>
                            <p style={{ fontSize: '13px', opacity: 0.6 }}>api.hallway.google</p>
                        </div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Frequently Asked Questions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                           {content.faq.map(f => (
                               <div key={f.q} style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                                   <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>{f.q}</p>
                                   <p style={{ fontSize: '14px', opacity: 0.6, lineHeight: '1.6' }}>{f.a}</p>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
             )}

             {activeTopic === 'privacy' && (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                     {content.points.map(p => (
                         <div key={p} style={{ padding: '24px', borderRadius: '24px', background: 'rgba(0, 255, 135, 0.05)', border: '1px solid rgba(0, 255, 135, 0.1)', textAlign: 'center' }}>
                             <Shield size={32} color="#00ff87" style={{ marginBottom: '16px' }} />
                             <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{p}</p>
                         </div>
                     ))}
                 </div>
             )}

             <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--border-color)', opacity: 0.4, fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>© 2026 GOOGLE HALLWAY / ALL RIGHTS RESERVED.</span>
                <span>AUTHENTICITY VERIFIED BY GOOGLE PLATFORM SERVICES</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export default HelpPage;
