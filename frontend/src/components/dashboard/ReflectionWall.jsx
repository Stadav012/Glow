import { useEffect, useRef } from 'react';
import './ReflectionWall.css';

const ReflectionWall = ({ reflections }) => {
  const wallRef = useRef(null);

  useEffect(() => {
    if (!reflections?.length) return;

    const wall = wallRef.current;
    const cards = wall.children;
    const numCards = cards.length;

    // Position cards in a cascading wall pattern
    const columns = Math.ceil(Math.sqrt(numCards));
    const spacing = 20; // Space between cards

    for (let i = 0; i < numCards; i++) {
      const column = i % columns;
      const row = Math.floor(i / columns);
      const card = cards[i];

      // Calculate position with slight randomness for natural feel
      const x = column * (300 + spacing) + (Math.random() - 0.5) * 20;
      const y = row * (200 + spacing) + (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 50; // Slight depth variation
      const rotation = (Math.random() - 0.5) * 10; // Slight rotation

      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotation}deg)`;
    }
  }, [reflections]);

  return (
    <div className="wall-container">
      <div className="reflection-wall" ref={wallRef}>
        {reflections?.map((reflection, index) => (
          <div 
            key={reflection._id || index} 
            className={`reflection-card mood-${reflection.mood.toLowerCase()}`}
          >
            <div className="card-content">
              <div className="card-header">
                <span className="mood-indicator">{reflection.mood}</span>
                <span className="date">
                  {new Date(reflection.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="reflection-text">{reflection.content}</p>
              <div className="card-footer">
                <span className="prompt-tag">{reflection.prompt}</span>
              </div>
            </div>
            <div className="card-glow"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReflectionWall;