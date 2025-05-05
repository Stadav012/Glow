import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const data = await response.json();
        setWaitlistPosition(data.position || 15);
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
      <h1 className="title">Your Feed's Been Lying to You</h1>

        <div className="mission-statement">
        <p className="lead-text">
            Glow helps you unlearn the internet.  
            Real people. Real convos. Real perspective.  
            Not another app telling you to "rise and grind."
        </p>
        </div>

        <div className="features-grid">
        <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Smart Prompts (Not Cringe)</h3>
            <p>We turn what you scroll into questions that actually make you think. No therapy voice required.</p>
        </div>
        <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Mentors, Not Motivators</h3>
            <p>People who get it 'cause they lived it. No mics. No monologues. Just facts.</p>
        </div>
        <div className="feature-card">
            <div className="feature-icon">🌟</div>
            <h3>Flip the Algorithm</h3>
            <p>What you scroll shapes your mindset. Let's twist that energy into something real.</p>
        </div>
        </div>

        <div className="waitlist-section">
        {!isSubmitted ? (
            <>
            <h2>Be the First to Touch Glow</h2>
            <p>It's not live for everyone yet. But it could be live for *you.*</p>
            <form onSubmit={handleSubmit} className="email-form">
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Drop your YouTube email"
                required
                />
                <button type="submit" className="submit-btn">Join the Waitlist</button>
            </form>
            </>
        ) : (
            <div className="success-message">
            <h2>You're Locked In 🔐</h2>
            <p>You are #{waitlistPosition} on the waitlist!</p>
            <p>We'll hit you up soon. Stay tuned 👀</p>
            <p>For now, go back to mindlessly scrolling through cat videos and food reels... we won't judge 😉</p>
            </div>
        )}
        </div>

        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
    </div>
  );
}