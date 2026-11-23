// ============================================================================
// HALLWAY ACCOUNT VALIDATION
// Client-side pre-flight checks for signup. These exist to give a human a
// readable error BEFORE the database is touched — the database will still
// enforce uniqueness, but a raw Postgres unique-violation is not a usable
// error message for someone joining the app for the first time.
// ============================================================================

// Names that would collide with app routes, API paths, or reserved words.
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'supabase', 'api', 'app',
  'login', 'logout', 'signup', 'signin', 'settings', 'profile', 'profiles',
  'post', 'posts', 'message', 'messages', 'notification', 'notifications',
  'search', 'explore', 'home', 'about', 'help', 'support', 'null', 'undefined',
  'me', 'you', 'all', 'new', 'edit', 'delete', 'true', 'false', 'static',
]);

// Usernames appear in URLs, @mentions and storage paths, so keep them boring.
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/**
 * Validate a signup username.
 * @returns {{valid: boolean, message?: string, username?: string}}
 */
export const validateUsername = (rawUsername) => {
  if (typeof rawUsername !== 'string' || rawUsername.trim() === '') {
    return { valid: false, message: 'Please choose a username.' };
  }

  const username = rawUsername.trim().toLowerCase();

  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      message: `Username must be at least ${USERNAME_MIN_LENGTH} characters.`
    };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      message: `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      message: 'Username can only contain lowercase letters, numbers and underscores.'
    };
  }

  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false, message: `"${username}" is reserved. Please choose another username.` };
  }

  if (/^\d+$/.test(username)) {
    return { valid: false, message: 'Username cannot be only numbers.' };
  }

  return { valid: true, username };
};

/**
 * Turn a Supabase/GoTrue error into something a person can act on.
 * @param {{message?: string, code?: string, status?: number}} error
 */
export const friendlyAuthError = (error) => {
  const raw = (error?.message || '').trim();
  const code = error?.code || '';

  if (/already registered|already been registered|duplicate/i.test(raw)) {
    return 'That email is already registered. Try signing in instead.';
  }

  if (/invalid login credentials/i.test(raw)) {
    return 'Incorrect email or password.';
  }

  if (/email not confirmed/i.test(raw)) {
    return 'Please confirm your email address before signing in.';
  }

  if (/password should be at least/i.test(raw)) {
    return 'Password must be at least 6 characters long.';
  }

  if (/unable to validate email|invalid email/i.test(raw)) {
    return 'Please enter a valid email address.';
  }

  if (/rate limit|too many requests/i.test(raw) || code === '429') {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (/fetch|network|failed to fetch/i.test(raw)) {
    return 'Could not reach the server. Check your connection and try again.';
  }

  // Anything we do not recognise: keep the server text but strip the noisy
  // prefixes Supabase adds, so it does not look like a crash.
  const cleaned = raw
    .replace(/^AuthApiError:\s*/i, '')
    .replace(/^Failed to fetch\s*/i, '');

  return cleaned || 'Something went wrong. Please try again.';
};

/**
 * Lightweight password check for the signup form.
 */
export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, message: 'Please choose a password.' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { valid: true };
};

/**
 * Lightweight email shape check.
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string' || email.trim() === '') {
    return { valid: false, message: 'Please enter your email address.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  return { valid: true };
};
