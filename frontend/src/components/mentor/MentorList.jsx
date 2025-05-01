import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MentorList.css';

const MentorList = ({ reflections, socialContent }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Filter out mentors with match score below 30%
  const filteredMentors = mentors.filter(mentor => mentor.matchScore >= 1);

  const handleMouseMove = (e, cardElement) => {
    const rect = cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardElement.style.setProperty('--mouse-x', `${x}px`);
    cardElement.style.setProperty('--mouse-y', `${y}px`);
  };

  useEffect(() => {
    const hasReflections = reflections && reflections.length > 0;
    const hasSocialContent = socialContent && Object.values(socialContent).some(content => Array.isArray(content) && content.length > 0);
    
    if (hasReflections || hasSocialContent) {
      fetchMentors();
    }
  }, [reflections && reflections.length, socialContent && JSON.stringify(socialContent)]);

  const fetchMentors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5100/api/mentor/recommended', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reflections,
          socialContent
        })
      });
      const data = await response.json();
      if (data.success) {
        setMentors(data.mentors);
      } else {
        setError('Failed to fetch mentors');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mentor-loading">
        <div className="loading-spinner"></div>
        <p>Finding your perfect mentors...</p>
      </div>
    );
  }

  if (error) {
    return <div className="mentor-error">{error}</div>;
  }

  return (
    <div className="mentor-container">
      <h2 className="mentor-title">Recommended Mentors</h2>
      <p className="mentor-subtitle">Based on your social media activity and reflections</p>
      
      <div className="mentor-preview-grid">
        {filteredMentors.map((mentor) => (
          <motion.div 
            key={mentor.id} 
            className={`mentor-preview-card ${expandedId === mentor.id ? 'expanded' : ''}`}
            onClick={() => setExpandedId(expandedId === mentor.id ? null : mentor.id)}
            onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, layout: { duration: 0.4 } }}
          >
            <div className="mentor-preview-header">
              <div className="mentor-avatar">
                {mentor.name.charAt(0)}
              </div>
              <div className="mentor-preview-info">
                <h3 className="mentor-name">{mentor.name}</h3>
                <div className="mentor-match-score">
                  <span className="score-number">{mentor.matchScore}%</span>
                  <span className="score-label">Match</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === mentor.id && (
                <motion.div 
                  className="mentor-details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="mentor-experience">{mentor.experience} Experience</p>
                  
                  <div className="mentor-expertise">
                    {mentor.expertise.map((skill, index) => (
                      <span key={index} className="expertise-tag">{skill}</span>
                    ))}
                  </div>

                  <p className="mentor-bio">{mentor.bio}</p>

                  <div className="match-reasons">
                    <h4>Why We Matched</h4>
                    <ul>
                      {mentor.matchReasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <button className="connect-button">
                    Connect with {mentor.name.split(' ')[0]}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MentorList;