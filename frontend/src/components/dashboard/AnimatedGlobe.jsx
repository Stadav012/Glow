import { useEffect, useRef } from 'react';
import './AnimatedGlobe.css';

const AnimatedGlobe = ({ likedContent }) => {
  const globeRef = useRef(null);
  const thumbnailRefs = useRef([]);

  useEffect(() => {
    if (!likedContent.length) return;

    const globe = globeRef.current;
    const thumbnails = thumbnailRefs.current;
    const radius = 150; // Radius of the globe
    const totalItems = likedContent.length;

    // Position thumbnails in a sphere
    thumbnails.forEach((thumb, index) => {
      if (!thumb) return;
      
      // Calculate position on the sphere
      const theta = (index / totalItems) * Math.PI * 2; // Horizontal angle
      const phi = Math.acos((2 * index) / totalItems - 1); // Vertical angle
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      // Apply transform
      thumb.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
    });

    // Rotation animation
    let frame;
    let angle = 0;

    const rotate = () => {
      angle += 0.005;
      globe.style.transform = `rotateY(${angle}rad) rotateX(23.5deg)`;
      frame = requestAnimationFrame(rotate);
    };

    rotate();

    return () => cancelAnimationFrame(frame);
  }, [likedContent]);

  return (
    <div className="globe-container">
      <div className="globe" ref={globeRef}>
        {likedContent.map((item, index) => (
          <div
            key={item.id}
            ref={el => thumbnailRefs.current[index] = el}
            className="thumbnail"
            onClick={() => window.open(item.url, '_blank')}
          >
            <img src={item.thumbnail} alt={item.title} />
            <div className="thumbnail-info">
              <h4>{item.title}</h4>
              <p>{item.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedGlobe;