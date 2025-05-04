import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Failed to join waitlist');
      }
    } catch (error) {
      alert('Error joining waitlist. Please try again.');
    }
  };

  return (
    <div className="landing-container">
      <div className="glass-card main-content">
        <h1 className="title">Reshape Your Educational Journey</h1>
        
        <div className="mission-statement">
          <p className="lead-text">
            We're transforming how high school students engage with media by starting with personalized reflection prompts.
            Connect with mentors who understand your journey and have walked a similar path just a few steps ahead.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Reflection</h3>
            <p>Thought-provoking prompts that help you understand your unique journey</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Mentor Connection</h3>
            <p>Connect with mentors who truly understand and inspire you</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌟</div>
            <h3>Media Transformation</h3>
            <p>Turn your media consumption into meaningful growth opportunities</p>
          </div>
        </div>

        <div className="waitlist-section">
          {!isSubmitted ? (
            <>
              <h2>Join Our Beta Testing Program</h2>
              <p>Be among the first to experience our revolutionary platform</p>
              <form onSubmit={handleSubmit} className="email-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your YouTube email"
                  required
                />
                <button type="submit" className="submit-btn">Join Waitlist</button>
              </form>
            </>
          ) : (
            <div className="success-message">
              <h2>Thank you for joining!</h2>
              <p>We'll contact you soon with access details.</p>
              <Link to="/auth" className="auth-link">Continue to Login</Link>
            </div>
          )}
        </div>
      </div>

      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
    </div>
  );
}