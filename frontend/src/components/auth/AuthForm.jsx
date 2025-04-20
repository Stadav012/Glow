import { useState } from 'react';
import './AuthForm.css';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    bio: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      
      // Handle successful registration
      if (step === 2) {
        // If on social media connection step, complete the registration
        window.location.href = '/dashboard'; // Redirect to dashboard or appropriate page
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const [sessionId] = useState(() => crypto.randomUUID());

  const socialLogin = (platform) => {
    try {
      console.log(`Logging in with ${platform}`);
      if (platform === 'YouTube') {
        // Add state parameter to track the auth flow
        const state = btoa(JSON.stringify({ sessionId, isRegistration: !isLogin }));
        window.location.href = `http://localhost:5000/api/social/youtube/login?sessionId=${sessionId}&state=${state}`;
      } else if (platform === 'Instagram') {
        window.location.href = `http://localhost:5000/api/social/instagram/login?sessionId=${sessionId}`;
      } else {
        console.warn(`Social login for ${platform} not implemented yet.`);
      }
    } catch (error) {
      console.error(`${platform} login error:`, error);
      alert(`${platform} login failed. Please try again.`);
    }
  };

  const nextStep = () => {
    const form = document.querySelector('.auth-card');
    form.classList.add('slide-exit');
    setTimeout(() => {
      setStep(2);
      form.classList.remove('slide-exit');
      form.classList.add('slide-enter');
    }, 500);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {isLogin ? (
          <>
            <h2>Welcome Back</h2>
            <div className="social-buttons">
              <button onClick={() => socialLogin('YouTube')} className="social-btn youtube">
                <i className="fab fa-youtube"></i>
              </button>
              <button onClick={() => socialLogin('Instagram')} className="social-btn instagram">
                <i className="fab fa-instagram"></i>
              </button>
              <button onClick={() => socialLogin('TikTok')} className="social-btn tiktok">
                <i className="fab fa-tiktok"></i>
              </button>
            </div>
            <div className="divider">or</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Sign In</button>
            </form>
            <p className="toggle-form">
              Don't have an account?
              <span onClick={() => setIsLogin(false)}>Sign Up</span>
            </p>
          </>
        ) : step === 1 ? (
          <>
            <h2>Create Account</h2>
            <div className="step-loader"></div>
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
              <div className="form-group">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  name="bio"
                  placeholder="Tell us about yourself"
                  value={formData.bio}
                  onChange={handleChange}
                  required
                  className="bio-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Next</button>
            </form>
            <p className="toggle-form">
              Already have an account?
              <span onClick={() => setIsLogin(true)}>Sign In</span>
            </p>
          </>
        ) : (
          <>
            <h2>Connect Your Social Media</h2>
            <p className="social-text">Choose your preferred platform to connect with</p>
            <div className="social-buttons">
              <button onClick={() => socialLogin('YouTube')} className="social-btn youtube">
                <i className="fab fa-youtube"></i>
              </button>
              <button onClick={() => socialLogin('Instagram')} className="social-btn instagram">
                <i className="fab fa-instagram"></i>
              </button>
              <button onClick={() => socialLogin('TikTok')} className="social-btn tiktok">
                <i className="fab fa-tiktok"></i>
              </button>
            </div>
            <button onClick={handleSubmit} className="submit-btn">Complete Registration</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthForm;