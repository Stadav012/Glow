import { useState, useEffect } from 'react';
import './ReflectionForm.css';

export default function ReflectionForm() {
  const [reflection, setReflection] = useState({
    mood: '',
    content: '',
    prompt: '',
    timestamp: new Date().toISOString()
  });
  const [prompts, setPrompts] = useState([]);

  const moodOptions = ['Happy', 'Energetic', 'Calm', 'Tired', 'Stressed', 'Anxious'];

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5100/api/reflections/prompts/personalized', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setPrompts(data.prompts);
      } catch (error) {
        console.error('Error fetching prompts:', error);
        setPrompts([
          'What inspired you today?',
          'What challenges did you face?',
          'What are you grateful for?'
        ]);
      }
    };

    fetchPrompts();
  }, []);

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
      
      // Clear form after successful submission
      setReflection({
        mood: '',
        content: '',
        prompt: '',
        timestamp: new Date().toISOString()
      });

      alert('Reflection saved successfully!');
    } catch (error) {
      alert('Error saving reflection: ' + error.message);
    }
  };

  return (
    <div className="reflection-container">
      <div className="reflection-card">
        <h2>Daily Reflection</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mood-selector">
            <h3>How are you feeling?</h3>
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

          <div className="prompt-section">
            <h3>Personalized Prompts</h3>
            <div className="prompt-options">
              {prompts.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  className={`prompt-btn ${reflection.prompt === prompt ? 'selected' : ''}`}
                  style={{ '--animation-order': index }}
                  onClick={() => setReflection({ ...reflection, prompt })}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="reflection-input"
            placeholder="Share your thoughts..."
            value={reflection.content}
            onChange={(e) => setReflection({ ...reflection, content: e.target.value })}
            required
          />

          <button type="submit" className="submit-btn">
            Save Reflection
          </button>
        </form>
      </div>
    </div>
  );
}