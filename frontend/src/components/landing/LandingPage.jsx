import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement email storage in database
    setIsSubmitted(true);
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="hero-section">
          <h1 className="hero-title">Transform Your YouTube Journey</h1>
          <p className="hero-subtitle">AI-Powered Reflection Tool for Content Creators</p>
        </div>

        <div className="mission-section">
          <h2>Our Mission</h2>
          <p>
            We're building the future of content creator development through
            AI-guided self-reflection. Our platform helps YouTubers like you gain
            deeper insights into your creative process, emotional journey, and
            professional growth.
          </p>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Insights</h3>
            <p>Get AI-powered feedback tailored to your content style</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Emotional Intelligence</h3>
            <p>Track and understand your creative emotional journey</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Growth Tracking</h3>
            <p>Visualize your progress and development over time</p>
          </div>
        </div>

        <div className="cta-section">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="email-form">
              <h2>Join Our Beta Testing</h2>
              <p>
                We're currently in testing phase. Enter your YouTube email to get
                early access and shape the future of creator development.
              </p>
              <div className="input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your YouTube email"
                  required
                />
                <button type="submit" className="submit-btn">
                  Get Early Access
                </button>
              </div>
            </form>
          ) : (
            <div className="success-message">
              <h2>Thank you for joining!</h2>
              <p>Continue to authentication to complete your registration.</p>
              <Link to="/auth" className="auth-link">
                Complete Registration
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;