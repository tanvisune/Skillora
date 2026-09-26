const USERS_KEY = 'skillora_users'
export const SESSION_KEY = 'skillora_session'
export const SESSION_CHANNEL = 'skillora_session_channel'

const demoUser = {
  id: 'student-ananya',
  name: 'Ananya Sharma',
  email: 'ananya@skillora.app',
  password: 'skillora123',
  role: 'student',
}

function getUsers() {
  const savedUsers = window.localStorage.getItem(USERS_KEY)
  if (!savedUsers) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify([demoUser]))
    return [demoUser]
  }

  try {
    return JSON.parse(savedUsers)
  } catch {
    window.localStorage.setItem(USERS_KEY, JSON.stringify([demoUser]))
    return [demoUser]
  }
}

export function signIn(email, password) {
  const user = getUsers().find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase() && entry.password === password)
  if (!user) return { ok: false, message: 'Email or password is incorrect.' }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }))
  notifySessionChange()
  return { ok: true, user }
}

export function registerUser(name, email, password, profile = {}) {
  const users = getUsers()
  const normalizedEmail = email.trim().toLowerCase()
  if (users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) return { ok: false, message: 'An account with this email already exists.' }

  const user = { id: `student-${Date.now()}`, name: name.trim(), email: normalizedEmail, password, role: 'student', ...profile }
  window.localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }))
  notifySessionChange()
  return { ok: true, user }
}

function notifySessionChange() {
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(SESSION_CHANNEL)
    channel.postMessage('session-changed')
    channel.close()
  }
}

export function signOut() {
  window.localStorage.removeItem(SESSION_KEY)
  notifySessionChange()
}

export function getSession() {
  const savedSession = window.localStorage.getItem(SESSION_KEY)
  if (!savedSession) return null

  try {
    return JSON.parse(savedSession)
  } catch {
    signOut()
    return null
  }
}

export function getDemoCredentials() {
  return { email: demoUser.email, password: demoUser.password }
}
