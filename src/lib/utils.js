export const formatDistanceToNow = (date) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  
  return new Date(date).toLocaleDateString();
};

export const truncate = (str, n) => {
  return str?.length > n ? str.substr(0, n - 1) + "..." : str;
};

export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

// Admin status comes from the DB (`public.profiles.role`) only.
//
// SECURITY: never grant admin from a username/email literal. A hardcoded
// identity check is a privilege-escalation hole: any account that can set its
// own username (signup metadata is user-controlled) would inherit admin.
// The authoritative check is the `profiles.role` column, which the DB
// protects with the `profiles_guard_role` trigger + RLS WITH CHECK.
export const isUserAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin';
};

// Verified status comes from the DB (`public.profiles.is_verified`) only.
//
// SECURITY: never grant verification from a username literal. Usernames are
// user-controlled at signup, so a hardcoded name list is an impersonation
// hole -- anyone who picks that name gets the badge for free. The database
// column is protected by the `guard_profile_role` trigger, which rejects any
// change unless the caller is an admin.
export const isUserVerified = (user) => {
  if (!user) return false;
  return user.is_verified === true;
};

const getSeed = (str) => {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const getDynamicAvatarUrl = (username = 'H', styleOpt = 'vibrant') => {
  const name = username || 'H';
  const seed = getSeed(name);
  
  const vibrantPresets = [
    { c1: '#6366f1', c2: '#a855f7', text: '#ffffff', isDark: true },
    { c1: '#00f2ff', c2: '#7000ff', text: '#ffffff', isDark: true },
    { c1: '#ff0055', c2: '#ffcc00', text: '#ffffff', isDark: true },
    { c1: '#00ff87', c2: '#60efff', text: '#0f172a', isDark: false },
    { c1: '#ff4500', c2: '#ff8c00', text: '#ffffff', isDark: true },
    { c1: '#ff71ce', c2: '#01cdfe', text: '#ffffff', isDark: true },
    { c1: '#e84393', c2: '#6c5ce7', text: '#ffffff', isDark: true }
  ];

  const lightPresets = [
    { c1: '#f8fafc', c2: '#e2e8f0', text: '#0f172a', isDark: false },
    { c1: '#eff6ff', c2: '#bfdbfe', text: '#1e3a8a', isDark: false },
    { c1: '#fdf2f8', c2: '#fbcfe8', text: '#9d174d', isDark: false },
    { c1: '#ecfdf5', c2: '#a7f3d0', text: '#065f46', isDark: false },
    { c1: '#fffbeb', c2: '#fde68a', text: '#78350f', isDark: false },
    { c1: '#faf5ff', c2: '#e9d5ff', text: '#581c87', isDark: false }
  ];

  const darkPresets = [
    { c1: '#090d16', c2: '#1e1b4b', text: '#818cf8', isDark: true },
    { c1: '#022c22', c2: '#064e3b', text: '#34d399', isDark: true },
    { c1: '#1c1917', c2: '#44403c', text: '#f5e6d3', isDark: true },
    { c1: '#1e1b4b', c2: '#311042', text: '#d946ef', isDark: true },
    { c1: '#0f172a', c2: '#334155', text: '#38bdf8', isDark: true }
  ];

  const monoPresets = [
    { c1: '#000000', c2: '#1e293b', text: '#ffffff', isDark: true },
    { c1: '#1e293b', c2: '#64748b', text: '#ffffff', isDark: true },
    { c1: '#e2e8f0', c2: '#ffffff', text: '#0f172a', isDark: false },
    { c1: '#0f172a', c2: '#000000', text: '#f8fafc', isDark: true }
  ];

  // Pick preset group
  let presets = vibrantPresets;
  if (styleOpt === 'light') presets = lightPresets;
  else if (styleOpt === 'dark') presets = darkPresets;
  else if (styleOpt === 'mono') presets = monoPresets;
  else if (styleOpt === 'random') {
    const groups = [vibrantPresets, lightPresets, darkPresets, monoPresets];
    presets = groups[seed % groups.length];
  }

  const grad = presets[seed % presets.length];
  
  // Decide geometric overlays based on seed
  const shapes = [
    `<circle cx="70" cy="70" r="50" fill="currentColor" opacity="0.12" />
     <circle cx="130" cy="130" r="40" fill="currentColor" opacity="0.08" />`,
    `<rect x="30" y="30" width="80" height="80" rx="20" fill="currentColor" opacity="0.08" transform="rotate(15 70 70)" />
     <circle cx="140" cy="80" r="30" fill="currentColor" opacity="0.12" />`,
    `<circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width="8" opacity="0.12" />
     <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" stroke-width="4" opacity="0.08" />`,
    `<polygon points="100,20 180,150 20,150" fill="currentColor" opacity="0.06" />
     <circle cx="100" cy="110" r="30" fill="currentColor" opacity="0.1" />`,
    `<line x1="0" y1="0" x2="200" y2="200" stroke="currentColor" stroke-width="12" opacity="0.08" />
     <line x1="200" y1="0" x2="0" y2="200" stroke="currentColor" stroke-width="8" opacity="0.08" />
     <circle cx="100" cy="100" r="45" fill="currentColor" opacity="0.12" />`
  ];

  const shapeMarkup = shapes[seed % shapes.length];
  const initial = name.charAt(0).toUpperCase();

  const fontFamilies = [
    "'Space Grotesk', 'Outfit', sans-serif",
    "'Outfit', sans-serif",
    "'JetBrains Mono', monospace",
    "Georgia, serif"
  ];
  const fontFamily = fontFamilies[seed % fontFamilies.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="grad-${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${grad.c1}" />
          <stop offset="100%" stop-color="${grad.c2}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad-${seed})" />
      <g color="${grad.text}">
        ${shapeMarkup}
        <text x="50%" y="56%" font-family="${fontFamily}" font-weight="900" font-size="85" fill="currentColor" text-anchor="middle" dominant-baseline="middle" opacity="0.95">${initial}</text>
      </g>
    </svg>
  `.trim().replace(/\s+/g, ' ');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

