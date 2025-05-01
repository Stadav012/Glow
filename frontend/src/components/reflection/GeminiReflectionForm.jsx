import { useState, useEffect } from 'react';
import './GeminiReflectionForm.css';

export default function GeminiReflectionForm({ onReflectionSubmitted }) {
  const [reflection, setReflection] = useState({
    mood: '',
    content: '',
    prompt: '',
    timestamp: new Date().toISOString()
  });
  const [prompts, setPrompts] = useState([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const moodOptions = ['Happy', 'Energetic', 'Calm', 'Tired', 'Stressed', 'Anxious'];

  useEffect(() => {
    let typingInterval;
    const controller = new AbortController();

    const fetchPrompts = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5100/api/reflections/prompts/personalized', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        const data = await response.json();
        if (!controller.signal.aborted) {
          setPrompts(data.prompts);
          setIsLoading(false);
          simulateTyping(data.prompts[0]);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching prompts:', error);
          const defaultPrompts = [
            'What inspired you today?',
            'What challenges did you face?',
            'What are you grateful for?'
          ];
          setPrompts(defaultPrompts);
          setIsLoading(false);
          simulateTyping(defaultPrompts[0]);
        }
      }
    };

    fetchPrompts();

    return () => {
      controller.abort();
      if (typingInterval) clearInterval(typingInterval);
    };
  }, []);

  const simulateTyping = (text) => {
    if (!text) return;
    
    setIsTyping(true);
    setReflection(prev => ({ ...prev, prompt: '' }));
    
    let i = 0;
    const typingSpeed = 30; // Faster typing speed
    const typing = setInterval(() => {
      setReflection(prev => ({
        ...prev,
        prompt: text.substring(0, i)
      }));
      i++;
      if (i > text.length) {
        clearInterval(typing);
        setIsTyping(false);
      }
    }, typingSpeed);
  };

  const handleNextPrompt = () => {
    const nextIndex = (currentPromptIndex + 1) % prompts.length;
    setCurrentPromptIndex(nextIndex);
    simulateTyping(prompts[nextIndex]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reflection.mood || !reflection.content || !reflection.prompt) {
      alert('Please fill in all required fields: mood, content, and select a prompt');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5100/api/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reflection)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reflection');
      }
      
      setReflection({
        mood: '',
        content: '',
        prompt: '',
        timestamp: new Date().toISOString()
      });

      alert('Reflection saved successfully!');
      if (onReflectionSubmitted) onReflectionSubmitted();
    } catch (error) {
      alert('Error saving reflection: ' + error.message);
    }
  };

  return (
    <div className="gemini-reflection-container">
      <div className="gemini-reflection-card">
        <div className="gemini-header">
          <h2>Daily Reflection</h2>
          <div className="gemini-mood-indicator">
            {reflection.mood && (
              <span className="selected-mood">
                Current Mood: {reflection.mood}
              </span>
            )}
          </div>
        </div>

        <div className="gemini-chat-container">
          <div className="gemini-prompt-message">
            <div className="gemini-avatar">
              <span>G</span>
            </div>
            <div className="gemini-message">
              <p className={`prompt-text ${isTyping ? 'typing' : ''}`}>
                {isLoading ? 'Loading prompts...' : (reflection.prompt || '...')}
              </p>
              {!isTyping && !isLoading && (
                <button 
                  className="next-prompt-btn"
                  onClick={handleNextPrompt}
                  type="button"
                >
                  Try another prompt
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="gemini-reflection-form">
            <div className="mood-selector">
              <div className="mood-options">
                {moodOptions.map((mood, index) => (
                  <button
                    key={mood}
                    type="button"
                    className={`mood-btn ${reflection.mood === mood ? 'selected' : ''}`}
                    style={{ '--animation-order': index }}
                    onClick={() => setReflection({ ...reflection, mood })}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="response-section">
              <textarea
                value={reflection.content}
                onChange={(e) => setReflection({ ...reflection, content: e.target.value })}
                placeholder="Share your thoughts..."
                rows="4"
              />
              <button type="submit" className="submit-btn">
                Save Reflection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}