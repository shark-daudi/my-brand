// api.js — Frontend ↔ Backend connector
// Place this in /public/api.js and include in index.html

const API = 'http://localhost:5000/api';

/* ══════════════════════════════════════
   AUTH
══════════════════════════════════════ */
const Auth = {
  // Store tokens
  save(data) {
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user',         JSON.stringify(data.user));
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  getToken()   { return localStorage.getItem('accessToken'); },
  getUser()    { return JSON.parse(localStorage.getItem('user') || 'null'); },
  isLoggedIn() { return !!Auth.getToken(); },

  // Register
  async register(name, email, password) {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    Auth.save(data);
    return data;
  },

  // Login
  async login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    Auth.save(data);
    return data;
  },

  // Logout
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    Auth.clear();
    window.location.reload();
  },

  // Get current user
  async me() {
    const res = await fetch(`${API}/auth/me`, {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    if (!res.ok) throw new Error('Not authenticated');
    return (await res.json()).user;
  },
};

/* ══════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════ */
async function submitForm() {
  const fname   = document.getElementById('fname');
  const lname   = document.getElementById('lname');
  const email   = document.getElementById('email');
  const service = document.getElementById('service');
  const message = document.getElementById('message');
  const btn     = document.querySelector('.contact-form .btn');

  let valid = true;
  function check(field, errId, condition) {
    const err = document.getElementById(errId);
    const fail = !condition;
    field.classList.toggle('error', fail);
    err.style.display = fail ? 'block' : 'none';
    if (fail) valid = false;
  }

  check(fname,   'fname-err', fname.value.trim().length > 0);
  check(lname,   'lname-err', lname.value.trim().length > 0);
  check(email,   'email-err', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value));
  check(message, 'msg-err',   message.value.trim().length > 10);
  if (!valid) return;

  // Loading state
  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: fname.value.trim(),
        last_name:  lname.value.trim(),
        email:      email.value.trim(),
        service:    service.value || undefined,
        message:    message.value.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submission failed');

    // Clear form
    [fname, lname, email, message].forEach(f => f.value = '');
    service.value = '';

    showToast('✓ Message sent! We\'ll reply within 24hrs.');
  } catch (err) {
    showToast('✗ ' + err.message, true);
  } finally {
    btn.textContent = 'Send Message →';
    btn.disabled = false;
  }
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = isError ? '#ff5b5b' : 'var(--accent)';
  toast.style.color = isError ? '#fff' : '#0b0c0e';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4500);
}

/* ══════════════════════════════════════
   AUTH MODAL (Login / Register)
   Injects a modal into the page
══════════════════════════════════════ */
function injectAuthModal() {
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeAuthModal()"></div>
    <div class="modal-box">
      <button class="modal-close" onclick="closeAuthModal()">✕</button>
      <div class="modal-tabs">
        <button class="tab active" onclick="switchTab('login')">Log In</button>
        <button class="tab" onclick="switchTab('register')">Sign Up</button>
      </div>

      <!-- Login -->
      <div id="login-form">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="login-email" placeholder="you@example.com"/>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-password" placeholder="••••••••"/>
        </div>
        <div id="auth-error" class="auth-error"></div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1rem"
          onclick="handleLogin()">Log In</button>
      </div>

      <!-- Register -->
      <div id="register-form" style="display:none">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="reg-name" placeholder="John Doe"/>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="reg-email" placeholder="you@example.com"/>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="reg-password" placeholder="Min 6 characters"/>
        </div>
        <div id="auth-error" class="auth-error"></div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1rem"
          onclick="handleRegister()">Create Account</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #auth-modal { position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center; }
    .modal-overlay { position:absolute;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px); }
    .modal-box {
      position:relative;background:var(--surface);border:1px solid var(--border);
      border-radius:16px;padding:2.5rem;width:100%;max-width:420px;z-index:1;
    }
    .modal-close {
      position:absolute;top:1rem;right:1rem;background:none;border:none;
      color:var(--muted);font-size:1.2rem;cursor:pointer;
    }
    .modal-tabs { display:flex;gap:0.5rem;margin-bottom:1.5rem; }
    .tab {
      flex:1;padding:0.6rem;background:var(--bg);border:1px solid var(--border);
      border-radius:8px;color:var(--muted);cursor:pointer;font-family:'Syne',sans-serif;
      font-weight:600;transition:var(--transition);
    }
    .tab.active { background:var(--accent);color:#0b0c0e;border-color:var(--accent); }
    .auth-error { color:#ff5b5b;font-size:0.85rem;min-height:1.2rem;margin-top:0.5rem; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);
}

function openAuthModal() {
  if (!document.getElementById('auth-modal')) injectAuthModal();
  document.getElementById('auth-modal').style.display = 'flex';
}
function closeAuthModal() {
  const m = document.getElementById('auth-modal');
  if (m) m.style.display = 'none';
}
function switchTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl    = document.querySelector('#login-form .auth-error');
  try {
    await Auth.login(email, password);
    closeAuthModal();
    updateNavForUser();
    showToast('✓ Welcome back!');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function handleRegister() {
  const name     = document.getElementById('reg-name').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const errEl    = document.querySelector('#register-form .auth-error');
  try {
    await Auth.register(name, email, password);
    closeAuthModal();
    updateNavForUser();
    showToast('✓ Account created! Welcome.');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

// Update nav buttons based on login state
function updateNavForUser() {
  const user = Auth.getUser();
  const actions = document.querySelector('.nav-actions');
  if (!actions) return;

  if (user) {
    actions.innerHTML = `
      <span style="color:var(--muted);font-size:0.9rem">Hi, ${user.name.split(' ')[0]}</span>
      <button class="btn btn-outline" style="padding:0.55rem 1.2rem;font-size:0.85rem"
        onclick="Auth.logout()">Log Out</button>
    `;
  }
}

// On page load — update nav if already logged in
document.addEventListener('DOMContentLoaded', () => {
  updateNavForUser();

  // Hook "Log in" button to open modal
  document.querySelectorAll('a[href="#contact"]').forEach(el => {
    if (el.textContent.trim() === 'Log in') {
      el.href = '#';
      el.addEventListener('click', e => { e.preventDefault(); openAuthModal(); });
    }
  });
});
