import { useEffect, useState } from 'react'
import './App.css'
import { getDemoCredentials, getSession, registerUser, SESSION_CHANNEL, SESSION_KEY, signIn, signOut } from './authStorage'

const navItems = [['Overview', '⌂'], ['Skill profile', '✦'], ['Skill assessment', '✓'], ['Opportunities', '↗'], ['Learning path', '◒']]
const assessmentQuestions = [
  { prompt: 'When starting a new product, what do you reach for first?', options: ['User interviews and observation', 'A visual moodboard', 'A technical specification', 'A project timeline'], skill: 'User research' },
  { prompt: 'How do you usually validate a design direction?', options: ['Usability testing with real users', 'Ask a teammate for feedback', 'Review the visual details alone', 'Ship it and measure later'], skill: 'Interaction design' },
  { prompt: 'How confident are you building a reusable component library?', options: ['I can create and document one', 'I can use an existing one', 'I understand the basics', 'I have not tried yet'], skill: 'Design systems' },
  { prompt: 'What is your strongest collaboration habit?', options: ['I make space for every voice', 'I keep projects organized', 'I explain complex ideas simply', 'I move quickly and iterate'], skill: 'Communication' },
]
const opportunities = [
  { company: 'Mosaic Labs', role: 'Product Design Intern', meta: 'Remote · 3 months', match: '94%', tone: 'coral', mark: 'M' },
  { company: 'Northstar', role: 'UX Research Project', meta: 'Bengaluru · 6 weeks', match: '87%', tone: 'gold', mark: 'N' },
  { company: 'OpenFrame', role: 'Design Systems Fellow', meta: 'Hybrid · 4 months', match: '82%', tone: 'blue', mark: 'O' },
]
const skills = [['User research', 'Advanced', 86, 'green'], ['Interaction design', 'Proficient', 72, 'yellow'], ['Figma', 'Proficient', 68, 'yellow'], ['Communication', 'Growing', 54, 'orange']]
const nextMoves = [
  ['Verify your skills', 'Build trust with recruiters', '✓', 'Add a project or certificate to verify your strongest skill.', 'teal'],
  ['Meet a mentor', 'Learn from industry experts', '◌', 'Find a product designer who can guide your next step.', 'blue'],
  ['Track applications', 'Keep every opportunity moving', '↗', 'You have 3 active applications waiting for an update.', 'orange'],
  ['Join a workshop', 'Grow with your community', '✦', 'A design systems workshop starts this Friday.', 'lime'],
]

function App() {
  const [session, setSession] = useState(() => getSession())
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('skillora_theme') === 'dark')
  const [activeNav, setActiveNav] = useState('Overview')
  const [saved, setSaved] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [notice, setNotice] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerCollege, setRegisterCollege] = useState('')
  const [registerCourse, setRegisterCourse] = useState('')
  const [registerYear, setRegisterYear] = useState('')
  const [registerGoal, setRegisterGoal] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showAssessment, setShowAssessment] = useState(false)
  const [assessmentStep, setAssessmentStep] = useState(0)
  const [assessmentAnswers, setAssessmentAnswers] = useState([])
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  useEffect(() => {
    const syncSession = (event) => {
      if (event.key === SESSION_KEY) setSession(getSession())
    }
    const syncFocusedSession = () => setSession(getSession())
    const syncVisibleSession = () => {
      if (document.visibilityState === 'visible') syncFocusedSession()
    }
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(SESSION_CHANNEL) : null
    if (channel) channel.onmessage = syncFocusedSession
    window.addEventListener('storage', syncSession)
    window.addEventListener('focus', syncFocusedSession)
    window.addEventListener('pageshow', syncFocusedSession)
    document.addEventListener('visibilitychange', syncVisibleSession)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener('focus', syncFocusedSession)
      window.removeEventListener('pageshow', syncFocusedSession)
      document.removeEventListener('visibilitychange', syncVisibleSession)
      channel?.close()
    }
  }, [])
  const toggleSave = (company) => setSaved(saved.includes(company) ? saved.filter((item) => item !== company) : [...saved, company])
  const initials = session?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AS'
  const allOpportunities = showAll ? [...opportunities, { company: 'Fieldnote', role: 'Junior Product Designer', meta: 'Mumbai · Full time', match: '79%', tone: 'violet', mark: 'F' }] : opportunities
  const announce = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }
  const selectNav = (label) => {
    setActiveNav(label)
    if (label === 'Opportunities') setShowAll(true)
    if (label === 'Skill assessment') {
      setShowAssessment(true)
      setAssessmentStep(0)
      setAssessmentAnswers([])
      setAssessmentComplete(false)
    }
    announce(`${label} workspace opened`)
  }
  const answerAssessment = (answerIndex) => {
    const answers = [...assessmentAnswers, answerIndex]
    setAssessmentAnswers(answers)
    if (assessmentStep === assessmentQuestions.length - 1) setAssessmentComplete(true)
    else setAssessmentStep(assessmentStep + 1)
  }
  const closeAssessment = () => {
    setShowAssessment(false)
    setAssessmentComplete(false)
    announce('Assessment saved to your skill profile.')
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const result = signIn(loginEmail, loginPassword)
    if (!result.ok) {
      setLoginError(result.message)
      return
    }
    setSession(result.user)
    setLoginError('')
  }

  const handleRegister = (event) => {
    event.preventDefault()
    if (loginPassword.length < 8) {
      setLoginError('Password must be at least 8 characters.')
      return
    }
    if (loginPassword !== confirmPassword) {
      setLoginError('Passwords do not match.')
      return
    }
    const result = registerUser(registerName, loginEmail, loginPassword, { college: registerCollege, course: registerCourse, graduationYear: registerYear, careerGoal: registerGoal, phone: registerPhone })
    if (!result.ok) {
      setLoginError(result.message)
      return
    }
    setSession(result.user)
    setLoginError('')
  }

  const fillDemoCredentials = () => {
    const credentials = getDemoCredentials()
    setLoginEmail(credentials.email)
    setLoginPassword(credentials.password)
    setLoginError('')
  }
  const toggleTheme = () => {
    const nextTheme = !darkMode
    setDarkMode(nextTheme)
    window.localStorage.setItem('skillora_theme', nextTheme ? 'dark' : 'light')
  }

  if (!session) return <div className={`auth-screen ${darkMode ? 'dark-mode' : ''}`}><button className="auth-theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">{darkMode ? '☀' : '◐'}</button><section className="auth-visual"><div className="brand auth-brand"><span className="brand-mark">S</span><span>skillora</span></div><div className="auth-message"><p className="eyebrow">Your career, mapped</p><h1>Turn your potential into a path.</h1><p>See the skills you have, the gaps to close, and the opportunities built for your next step.</p><div className="auth-stat-row"><span><strong>24</strong><small>skills mapped</small></span><span><strong>94%</strong><small>best match</small></span><span><strong>12</strong><small>new paths</small></span></div></div></section><section className="auth-panel"><div className="auth-form-wrap"><p className="eyebrow">Student workspace</p><h2>{isRegistering ? 'Create your account.' : 'Welcome back.'}</h2><p className="auth-subtitle">{isRegistering ? 'Build a profile that helps the right opportunities find you.' : 'Sign in to continue your Skillora journey.'}</p><form onSubmit={isRegistering ? handleRegister : handleLogin}>{isRegistering && <><label>Full name<input type="text" value={registerName} onChange={(event) => setRegisterName(event.target.value)} placeholder="Your name" required /></label><label>College or university<input type="text" value={registerCollege} onChange={(event) => setRegisterCollege(event.target.value)} placeholder="Your college" required /></label><div className="form-two-col"><label>Course<input type="text" value={registerCourse} onChange={(event) => setRegisterCourse(event.target.value)} placeholder="B.Des, B.Tech" required /></label><label>Graduation year<select value={registerYear} onChange={(event) => setRegisterYear(event.target.value)} required><option value="">Select year</option><option>2026</option><option>2027</option><option>2028</option><option>2029</option></select></label></div><label>Career goal<select value={registerGoal} onChange={(event) => setRegisterGoal(event.target.value)} required><option value="">Choose a direction</option><option>Product design</option><option>Software engineering</option><option>Data and analytics</option><option>Marketing and growth</option></select></label><label>Phone number<input type="tel" value={registerPhone} onChange={(event) => setRegisterPhone(event.target.value)} placeholder="Optional" /></label></>}<label>Email address<input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder={isRegistering ? 'At least 8 characters' : 'Enter your password'} minLength={isRegistering ? 8 : undefined} required /></label>{isRegistering && <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required /></label>}{loginError && <p className="login-error" role="alert">{loginError}</p>}<button className="primary-btn auth-submit" type="submit">{isRegistering ? 'Create account' : 'Sign in'} <span>→</span></button></form>{!isRegistering && <button className="demo-login" onClick={fillDemoCredentials}>Use demo account <span>ananya@skillora.app</span></button>}<button className="auth-switch" onClick={() => { setIsRegistering(!isRegistering); setLoginError(''); setLoginPassword(''); setConfirmPassword('') }}>{isRegistering ? 'Already have an account? Sign in' : 'New to Skillora? Create an account'}</button><p className="auth-footnote">Your account is stored locally for this prototype.</p></div></section></div>

  return <div className={`app-shell ${darkMode ? 'dark-mode' : ''}`}>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span>skillora</span></div>
        <div className="profile-mini"><div className="avatar">{initials}</div><div><strong>{session.name}</strong><span>{session.role === 'student' ? 'Student · Skillora' : session.role}</span></div><span className="chevron">⌄</span></div>
      <nav aria-label="Primary navigation"><span className="nav-label">Workspace</span>{navItems.map(([label, icon]) => <button className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => selectNav(label)} key={label}><span className="nav-icon">{icon}</span>{label}{label === 'Opportunities' && <span className="nav-count">12</span>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => announce('Help center is ready. Support will be connected soon.')}><span className="nav-icon">?</span>Help center</button><button className="nav-item" onClick={() => { signOut(); setSession(null) }}><span className="nav-icon">↪</span>Sign out</button><p className="sidebar-note">Your profile is <strong>78%</strong> complete.<br /><button onClick={() => setShowProfile(true)}>Finish it <span>→</span></button></p></div>
    </aside>
    <main className="main-content">
      <div className="page-content">
          <section className="welcome-row"><div><p className="eyebrow">Monday, 14 October 2024</p><h1>Good morning, {session.name.split(' ')[0]}<span>.</span></h1><p className="subhead">Here is your progress toward becoming a product designer.</p></div><button className="primary-btn" onClick={() => setShowProfile(true)}>Update my profile <span>→</span></button></section>
          <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {activeNav}</div><div className="top-actions"><button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">{darkMode ? '☀' : '◐'}</button><div className="notification-wrap"><button className="icon-btn" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>♧<i /></button>{showNotifications && <div className="notification-popover"><strong>Notifications</strong><p>Your profile match improved for Mosaic Labs.</p><p>New learning path: Design systems in Figma.</p><button onClick={() => setShowNotifications(false)}>Mark as read</button></div>}</div><button className="top-avatar" onClick={() => setShowProfile(true)} aria-label="Open profile">{initials}</button></div></header>
        <section className="stats-grid"><div className="stat-card highlight"><div className="stat-heading"><span>Profile strength</span><span className="spark">✦</span></div><strong>78<span>%</span></strong><div className="progress"><span style={{ width: '78%' }} /></div><p>+12% this month</p></div><div className="stat-card"><div className="stat-heading"><span>Skills mapped</span><span className="stat-icon teal">✦</span></div><strong>24</strong><p><b>18 technical</b> · 6 soft skills</p></div><div className="stat-card"><div className="stat-heading"><span>Opportunity matches</span><span className="stat-icon peach">↗</span></div><strong>12</strong><p><b>4 new</b> since last week</p></div></section>
        <section className="next-moves"><div className="section-heading"><div><p className="eyebrow">More ways to move forward</p><h2>Your next best actions</h2></div><span className="live-badge"><i /> Personalised for you</span></div><div className="move-grid">{nextMoves.map(([title, subtitle, icon, message, tone]) => <button className="move-card" key={title} onClick={() => announce(message)}><span className={`move-icon ${tone}`}>{icon}</span><span className="move-text"><strong>{title}</strong><small>{subtitle}</small></span><span className="move-arrow">→</span></button>)}</div></section>
        <section className="section-heading"><div><p className="eyebrow">Your compass</p><h2>Build the skills that move you forward</h2></div><button className="text-btn" onClick={() => selectNav('Skill profile')}>View full profile <span>→</span></button></section>
        <section className="dashboard-grid"><div className="panel skills-panel"><div className="panel-title"><h3>Skill snapshot</h3><span className="pill">Updated today</span></div><div className="skill-list">{skills.map(([skill, level, percent, tone]) => <div className="skill-row" key={skill}><div className="skill-copy"><span>{skill}</span><small className={tone}>{level}</small></div><div className="skill-bar"><span className={tone} style={{ width: `${percent}%` }} /></div><strong>{percent}%</strong></div>)}</div><button className="panel-link" onClick={() => selectNav('Skill profile')}>Explore your skill map <span>→</span></button></div><div className="panel gap-panel"><div className="panel-title"><h3>One gap to close</h3><span className="warning">!</span></div><div className="gap-body"><div className="gap-ring"><span>48<span>%</span></span><small>current</small></div><div><h4>Design systems</h4><p>It is showing up in <b>7 of 12</b> roles you match with.</p><button className="dark-btn" onClick={() => selectNav('Learning path')}>Start a learning path <span>→</span></button></div></div><button className="recommend" onClick={() => announce('Learning resource added to your path.')}><span className="book-icon">▤</span><span><b>Recommended for you</b><br />Design systems in Figma · 2h 15m</span><span className="arrow">→</span></button></div></section>
        <section className="section-heading opportunity-heading"><div><p className="eyebrow">Curated for your profile</p><h2>{showAll ? 'All opportunities' : 'Opportunities worth a look'}</h2></div><button className="text-btn" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show less' : 'View all opportunities'} <span>→</span></button></section>
        <section className="opportunity-list">{allOpportunities.map((item) => <article className="opportunity" key={item.company}><div className={`company-mark ${item.tone}`}>{item.mark}</div><button className="opportunity-info" onClick={() => setSelectedOpportunity(item)}><strong>{item.role}</strong><span>{item.company} <i>·</i> {item.meta}</span></button><div className="match"><strong>{item.match}</strong><span>match</span></div><button className={saved.includes(item.company) ? 'bookmark saved' : 'bookmark'} onClick={() => toggleSave(item.company)} aria-label={`Save ${item.role}`}>{saved.includes(item.company) ? '♥' : '♡'}</button><button className="row-arrow" onClick={() => setSelectedOpportunity(item)} aria-label={`Open ${item.role}`}>→</button></article>)}</section>
        <footer><span>Skillora for students</span><span>Made for the next version of you <b>✦</b></span></footer>
      </div>
      {showProfile && <div className="modal-backdrop" onClick={() => setShowProfile(false)}><section className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowProfile(false)} aria-label="Close profile">×</button><p className="eyebrow">Your profile</p><h2>Finish your profile</h2><p className="modal-copy">A fuller profile helps Skillora find more relevant internships and mentors.</p><label>Career direction<input defaultValue="Product design" /></label><label>Portfolio link<input placeholder="https://your-portfolio.com" /></label><button className="primary-btn" onClick={() => { setShowProfile(false); announce('Profile saved. Your matches are now refreshed.') }}>Save profile <span>→</span></button></section></div>}
      {showAssessment && <div className="assessment-backdrop"><section className="assessment-window" onClick={(event) => event.stopPropagation()}><header className="assessment-header"><button className="back-button" onClick={closeAssessment}>← <span>Back to workspace</span></button><div className="brand assessment-brand"><span className="brand-mark">S</span><span>skillora</span></div><span className="assessment-label">Student skill assessment</span></header><div className="assessment-content">{assessmentComplete ? <><p className="eyebrow">Assessment complete</p><h2>Your skill map is clearer.</h2><div className="assessment-result"><span className="result-score">{Math.round((assessmentAnswers.reduce((total, answer) => total + (4 - answer), 0) / (assessmentQuestions.length * 4)) * 100)}%</span><div><strong>Profile confidence</strong><p>Your answers highlight strengths in research and collaboration. We added Design systems to your learning priorities.</p></div></div><button className="primary-btn" onClick={closeAssessment}>View my updated profile <span>→</span></button></> : <><p className="eyebrow">Question {assessmentStep + 1} of {assessmentQuestions.length}</p><div className="assessment-progress"><span style={{ width: `${((assessmentStep + 1) / assessmentQuestions.length) * 100}%` }} /></div><h2>{assessmentQuestions[assessmentStep].prompt}</h2><p className="modal-copy">Choose the answer that feels most like you. There are no wrong answers.</p><div className="answer-list">{assessmentQuestions[assessmentStep].options.map((option, index) => <button key={option} onClick={() => answerAssessment(index)}><span>{String.fromCharCode(65 + index)}</span>{option}<b>→</b></button>)}</div></>}</div></section></div>}
      {selectedOpportunity && <div className="modal-backdrop" onClick={() => setSelectedOpportunity(null)}><section className="modal opportunity-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedOpportunity(null)} aria-label="Close opportunity">×</button><div className={`company-mark ${selectedOpportunity.tone}`}>{selectedOpportunity.mark}</div><p className="eyebrow">{selectedOpportunity.company}</p><h2>{selectedOpportunity.role}</h2><p className="modal-copy">{selectedOpportunity.meta}. This opportunity is a {selectedOpportunity.match} match for your current skill profile.</p><button className="dark-btn" onClick={() => { toggleSave(selectedOpportunity.company); announce('Opportunity saved to your shortlist.'); setSelectedOpportunity(null) }}>{saved.includes(selectedOpportunity.company) ? 'Remove from shortlist' : 'Save to shortlist'} <span>→</span></button></section></div>}
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  </div>
}

export default App
