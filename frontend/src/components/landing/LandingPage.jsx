import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import targetIcon from '../../assets/icons/target.svg';
import brainIcon from '../../assets/icons/brain.svg';
import phoneIcon from '../../assets/icons/phone.svg';

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
            Made for high schoolers, open to curious educators.  
            Glow helps you rethink what success actually looks like, using your feed, your voice, and people who actually get it.  
            Not another adult yelling "stay in school." Chill.
        </p>
        </div>

        <div className="features-grid">
        <div className="feature-card">
            <div className="feature-icon"><img src={targetIcon} alt="Target icon" /></div>
            <h3>Smart Prompts (Not Cringe)</h3>
            <p>We flip your feed into convo starters that actually hit. No wellness quotes. No deep sighing.</p>
        </div>
        <div className="feature-card">
            <div className="feature-icon"><img src={brainIcon} alt="Brain icon" /></div>
            <h3>Mentors Who’ve Been There</h3>
            <p>Not influencers. Not guidance counselors. Real people who made it out the same maze you're in.</p>
        </div>
        <div className="feature-card">
            <div className="feature-icon"><img src={phoneIcon} alt="Phone icon" /></div>
            <h3>Flip the Algorithm</h3>
            <p>Your scroll shapes your brain. We help you hijack it back, before it turns into hustle-hype soup.</p>
        </div>
        </div>

        <div className="waitlist-section">
        {!isSubmitted ? (
            <>
            <h2>Glow Is Kinda Like AirDrop for Ambition</h2>
            <p>These are the convos that change your direction. Not gonna lie, this is the stuff no one teaches in class.</p>
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
            <p>You’re #<b>{waitlistPosition}</b> in line. You trendsetter, you.</p>
            <p>We’ll hit you up soon. Until then, keep dodging bad advice and weird hustle gurus.</p>
            <p>Or go back to doomscrolling... no judgment 😉</p>
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