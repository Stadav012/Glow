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
            We're flipping the narrative around media consumption for high school students.
            Transform how you engage with educational content and reshape your mindset around learning.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Targeted Content</h3>
            <p>Curated educational media that resonates with your interests</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Mindset Shift</h3>
            <p>Transform your perspective on learning and education</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌟</div>
            <h3>Personal Growth</h3>
            <p>Develop a growth mindset through engaging content</p>
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