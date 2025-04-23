import { useEffect, useRef } from 'react';
import './AnimatedGlobe.css';

const ReflectionGlobe = ({ reflections }) => {
  const globeRef = useRef(null);

  useEffect(() => {
    if (!reflections?.length) return;

    const globe = globeRef.current;
    const thumbnails = globe.children;
    const numThumbnails = thumbnails.length;

    // Position reflections in a spherical pattern
    for (let i = 0; i < numThumbnails; i++) {
      const theta = (i / numThumbnails) * 2 * Math.PI; // Horizontal angle
      const phi = Math.acos((2 * i) / numThumbnails - 1); // Vertical angle
      const radius = 150; // Sphere radius

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const thumbnail = thumbnails[i];
      thumbnail.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
    }

    // Rotate the globe
    let angle = 0;
    const animate = () => {
      angle += 0.005;
      globe.style.transform = `rotateY(${angle}rad) rotateX(23.5deg)`;
      requestAnimationFrame(animate);
    };
    animate();
  }, [reflections]);

  return (
    <div className="globe-container">
      <div className="globe" ref={globeRef}>
        {reflections?.map((reflection, index) => (
          <div key={reflection._id || index} className="thumbnail reflection">
            <div className="reflection-content">
              <span className="mood-indicator">{reflection.mood}</span>
              <p>{reflection.content.substring(0, 50)}...</p>
              <small>{new Date(reflection.timestamp).toLocaleDateString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReflectionGlobe;