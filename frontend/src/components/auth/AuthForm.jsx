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

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement authentication logic
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const socialLogin = (platform) => {
    // TODO: Implement social login
    console.log(`Logging in with ${platform}`);
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