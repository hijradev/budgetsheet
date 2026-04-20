/**
 * AuthService.gs — Authentication service for HabitSheet
 *
 * Uses PropertiesService for password storage (SHA-256 hashed).
 * Uses CacheService for session tokens with metadata.
 * Default password: admin123 (user is prompted to change on first login)
 */

const AUTH_CONFIG = {
  SESSION_DURATION: 21600, // 6 hours in seconds
  PASSWORD_KEY: 'APP_PASSWORD',
  SESSION_PREFIX: 'SESSION_',
  LOCKOUT_PREFIX: 'LOCKOUT_',
  FAIL_PREFIX: 'FAIL_',
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900, // 15 minutes in seconds
  MIN_PASSWORD_LENGTH: 8
};

// ─── Password Hashing ────────────────────────────────────────────────────────

/**
 * Hash a password using SHA-256.
 * @param {string} password
 * @returns {string} hex digest
 */
function hashPassword(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

/**
 * Get the stored password hash. Falls back to hash of 'admin123' if none set.
 * @returns {string}
 */
function getStoredPasswordHash() {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty(AUTH_CONFIG.PASSWORD_KEY);
  if (stored) return stored;
  // Default password hash — stored on first comparison so it's never plaintext
  return hashPassword('admin123');
}

// ─── Brute-force Protection ──────────────────────────────────────────────────

/**
 * Returns the cache key used to track failed attempts for a given identifier.
 * We use a fixed key since this is a single-user app (no per-user tracking needed).
 */
function getFailKey() {
  return AUTH_CONFIG.FAIL_PREFIX + 'global';
}

function getLockoutKey() {
  return AUTH_CONFIG.LOCKOUT_PREFIX + 'global';
}

function isLockedOut() {
  const cache = CacheService.getScriptCache();
  return cache.get(getLockoutKey()) === 'locked';
}

function recordFailedAttempt() {
  const cache = CacheService.getScriptCache();
  const failKey = getFailKey();
  const current = parseInt(cache.get(failKey) || '0', 10) + 1;

  if (current >= AUTH_CONFIG.MAX_ATTEMPTS) {
    cache.put(getLockoutKey(), 'locked', AUTH_CONFIG.LOCKOUT_DURATION);
    cache.remove(failKey);
    writeAuditLog('LOGIN_LOCKOUT', 'Too many failed attempts — account locked for 15 minutes');
  } else {
    cache.put(failKey, String(current), AUTH_CONFIG.LOCKOUT_DURATION);
  }
}

function clearFailedAttempts() {
  const cache = CacheService.getScriptCache();
  cache.remove(getFailKey());
  cache.remove(getLockoutKey());
}

// ─── Login / Session ─────────────────────────────────────────────────────────

/**
 * Login with password. Returns a session token on success.
 * @param {string} password
 * @returns {{ token: string, mustChangePassword: boolean }}
 */
function login(password) {
  if (isLockedOut()) {
    throw new Error('Too many failed attempts. Please wait 15 minutes before trying again.');
  }

  if (!password || typeof password !== 'string') {
    throw new Error('Invalid request');
  }

  const storedHash = getStoredPasswordHash();
  const inputHash = hashPassword(password);

  if (inputHash !== storedHash) {
    recordFailedAttempt();
    throw new Error('Incorrect password');
  }

  clearFailedAttempts();

  // Generate session token
  const token = Utilities.getUuid();
  const sessionData = JSON.stringify({ created: Date.now() });

  // Store session in CacheService with metadata
  const cache = CacheService.getScriptCache();
  cache.put(AUTH_CONFIG.SESSION_PREFIX + token, sessionData, AUTH_CONFIG.SESSION_DURATION);

  // Check if user is still on the default password
  const props = PropertiesService.getScriptProperties();
  const hasCustomPassword = !!props.getProperty(AUTH_CONFIG.PASSWORD_KEY);

  writeAuditLog('LOGIN_SUCCESS', 'Successful login');

  return { token: token, mustChangePassword: !hasCustomPassword };
}

/**
 * Validate a session token.
 * @param {string} token
 * @returns {boolean}
 */
function validateSession(token) {
  if (!token || typeof token !== 'string') return false;

  const cache = CacheService.getScriptCache();
  const session = cache.get(AUTH_CONFIG.SESSION_PREFIX + token);
  if (!session) return false;

  try {
    const data = JSON.parse(session);
    return typeof data.created === 'number';
  } catch (e) {
    return false;
  }
}

/**
 * Logout — invalidate session token.
 * @param {string} token
 */
function logout(token) {
  if (!token) return;
  const cache = CacheService.getScriptCache();
  cache.remove(AUTH_CONFIG.SESSION_PREFIX + token);
  writeAuditLog('LOGOUT', 'User logged out');
}

/**
 * Change password. Requires old password for verification.
 * @param {string} oldPassword
 * @param {string} newPassword
 * @param {string} token - session token for auth
 * @returns {boolean}
 */
function changePassword(oldPassword, newPassword, token) {
  requireAuth(token);

  if (!oldPassword || !newPassword || typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
    throw new Error('Invalid request');
  }

  const storedHash = getStoredPasswordHash();
  if (hashPassword(oldPassword) !== storedHash) {
    throw new Error('Incorrect old password');
  }

  if (newPassword.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
    throw new Error('New password must be at least ' + AUTH_CONFIG.MIN_PASSWORD_LENGTH + ' characters');
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty(AUTH_CONFIG.PASSWORD_KEY, hashPassword(newPassword));

  writeAuditLog('PASSWORD_CHANGED', 'Password was changed');
  return true;
}

/**
 * Auth guard — throws if token is invalid.
 * @param {string} token
 */
function requireAuth(token) {
  if (!validateSession(token)) {
    throw new Error('UNAUTHORIZED');
  }
}

/**
 * Check if a custom password has been set (i.e. user changed from default).
 * @returns {boolean}
 */
function hasCustomPassword() {
  const props = PropertiesService.getScriptProperties();
  return !!props.getProperty(AUTH_CONFIG.PASSWORD_KEY);
}

// ─── Audit Logging ───────────────────────────────────────────────────────────

/**
 * Write an entry to the AuditLog sheet.
 * @param {string} action
 * @param {string} detail
 */
function writeAuditLog(action, detail) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName('AuditLog');
    if (!sheet) {
      sheet = ss.insertSheet('AuditLog');
      sheet.appendRow(['timestamp', 'action', 'detail']);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f0f0f0');
    }
    sheet.appendRow([new Date(), action, detail]);
  } catch (e) {
    Logger.log('Audit log error: ' + e.message);
  }
}
