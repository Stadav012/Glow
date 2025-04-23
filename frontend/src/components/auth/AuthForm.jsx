import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AuthForm.css';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    bio: ''
  });

  /* ───────── helpers ───────── */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const socialLogin = (platform) => {
    // Save the form so we still have it after Google/Instagram redirects back
    if (step === 2) {
      localStorage.setItem('signupForm', JSON.stringify(formData));
    }
    // Clear form data for social login
    setFormData({ ...formData, email: '', password: '' });
    window.location.href =
      `http://localhost:5100/api/social/${platform.toLowerCase()}/login?sessionId=${sessionId}`;
  };

  const nextStep = () => {
    document.querySelector('.auth-card')?.classList.add('slide-exit');
    setTimeout(() => {
      setStep(2);
      document.querySelector('.auth-card')?.classList.remove('slide-exit');
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Skip validation for social login
    if (!formData.email && !formData.password) {
      return;
    }
    const endpoint = isLogin ? 'login' : 'register';
    const res = await fetch(`http://localhost:5100/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, sessionId })
    });
    if (!res.ok) return alert(`${isLogin ? 'Login' : 'Registration'} failed, try again!`);
    const { token } = await res.json();
    localStorage.setItem('token', token);
    navigate('/dashboard');
  };

  /* ───────── auto‑register after OAuth round‑trip ───────── */
  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');
    
    if (error) {
      alert(`Authentication failed: ${error}`);
      return;
    }
    
    if (status !== 'success') return;

    const saved = JSON.parse(localStorage.getItem('signupForm'));
    const sessionId = searchParams.get('sessionId');
    const endpoint = saved ? 'register' : 'login';

    (async () => {
      try {
        const res = await fetch(`http://localhost:5100/api/auth/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(saved || {}),
            sessionId
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `${endpoint === 'login' ? 'Login' : 'Registration'} failed`);
        }
        
        localStorage.setItem('token', data.token);
        if (saved) localStorage.removeItem('signupForm');
        navigate('/dashboard');
      } catch (err) {
        alert(err.message);
      }
    })();
  }, [searchParams, navigate]);

  /* ───────── UI ───────── */
  return (
    <div className="auth-container">
      <div className="auth-card">
        {isLogin ? (
          /* ---------- SIGN IN ---------- */
          <>
            <h2>Welcome Back</h2>
            <div className="social-buttons">
              {['YouTube', 'Instagram'].map((p) => (
                <button key={p} onClick={() => socialLogin(p)} className={`social-btn ${p.toLowerCase()}`}>
                  <i className={`fab fa-${p.toLowerCase()}`}></i>
                </button>
              ))}
            </div>
            <div className="divider">or</div>
            <form onSubmit={handleSubmit}>
              <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              <button className="submit-btn">Sign In</button>
            </form>
            <p className="toggle-form">Don’t have an account? <span onClick={() => setIsLogin(false)}>Sign Up</span></p>
          </>
        ) : step === 1 ? (
          /* ---------- SIGN UP — STEP 1 ---------- */
          <>
            <h2>Create Account</h2>
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
              <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
              <textarea name="bio" placeholder="Tell us about yourself" value={formData.bio} onChange={handleChange} required />
              <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
              <button className="submit-btn">Next</button>
            </form>
            <p className="toggle-form">Already have an account? <span onClick={() => setIsLogin(true)}>Sign In</span></p>
          </>
        ) : (
          /* ---------- SIGN UP — STEP 2 (SOCIAL) ---------- */
          <>
            <h2>Connect Your Social Media</h2>
            <p className="social-text">Choose a platform to link</p>
            <div className="social-buttons">
              {['YouTube', 'Instagram'].map((p) => (
                <button key={p} onClick={() => socialLogin(p)} className={`social-btn ${p.toLowerCase()}`}>
                  <i className={`fab fa-${p.toLowerCase()}`}></i>
                </button>
              ))}
            </div>
            <button onClick={handleSubmit} className="submit-btn">Complete Registration</button>
          </>
        )}
      </div>
    </div>
  );
}
