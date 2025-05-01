import { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import GeminiReflectionForm from '../reflection/GeminiReflectionForm';
import AnimatedGlobe from './AnimatedGlobe';
import ReflectionWall from './ReflectionWall';
import MentorList from '../mentor/MentorList';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [reflections, setReflections] = useState([]);
  
  // Function to fetch reflections
  const fetchReflections = useCallback(async (token) => {
    try {
      const reflectionsRes = await fetch('http://localhost:5100/api/reflections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (reflectionsRes.ok) {
        const reflectionsData = await reflectionsRes.json();
        setReflections(reflectionsData);
      }
    } catch (error) {
      console.error('Error fetching reflections:', error);
    }
  }, []);
  // Update state to hold standardized content types
  const [content, setContent] = useState({
    posts: [], // User's uploaded videos
    likedContent: [], // User's liked videos
    instagram: [] // Keep instagram if needed
  });
  const [contentErrors, setContentErrors] = useState({
    youtube: null,
    instagram: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // For general errors like fetching user data

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user data
        const response = await fetch('http://localhost:5100/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Fetch reflections using the callback
        await fetchReflections(token);
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        setUser(data.user);

        // Reset content and errors before fetching
        setContent({
          posts: [],
          likedContent: [],
          instagram: []
        });
        setContentErrors({ youtube: null, instagram: null });

        // Fetch YouTube content if account is connected
        if (data.user.socialAccounts?.youtube?.accessToken) { // Check for accessToken instead of channelId
          try {
            const youtubeRes = await fetch(`http://localhost:5100/api/social/youtube/content`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (youtubeRes.ok) {
              const youtubeData = await youtubeRes.json();
              setContent(prev => ({
                ...prev,
                posts: youtubeData.posts || [],
                likedContent: youtubeData.likedContent || []
              }));
              // Store potential errors from the backend response's errors object
              if (youtubeData.errors) {
                const ytErrors = Object.entries(youtubeData.errors)
                                     .map(([key, value]) => `${key}: ${value}`)
                                     .join('; ');
                 if (ytErrors) {
                    setContentErrors(prev => ({ ...prev, youtube: ytErrors }));
                 }
              }
            } else {
              const errorData = await youtubeRes.json();
              throw new Error(errorData.error || `YouTube fetch failed: ${youtubeRes.statusText}`);
            }
          } catch (ytError) {
            console.error("YouTube fetch error:", ytError);
            setContentErrors(prev => ({ ...prev, youtube: ytError.message }));
          }
        }

        // Fetch Instagram content (keep existing logic if needed)
        if (data.user.socialAccounts?.instagram?.userId) {
          try {
            const instaRes = await fetch(`http://localhost:5100/api/social/instagram/content`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (instaRes.ok) {
              const instaData = await instaRes.json();
              setContent(prev => ({ ...prev, instagram: instaData.items || [] }));
            } else {
               const errorData = await instaRes.json();
               throw new Error(errorData.error || `Instagram fetch failed: ${instaRes.statusText}`);
            }
          } catch (instaError) {
             console.error("Instagram fetch error:", instaError);
             setContentErrors(prev => ({ ...prev, instagram: instaError.message }));
          }
        }
      } catch (err) {
        setError(err.message); // Set general error
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;
  if (error) return <div className="dashboard-error">Error: {error}</div>; // Display general error
  if (!user) return null;

  // Helper to check if any YouTube content exists
  const hasYoutubeContent = content.posts.length > 0 || content.likedContent.length > 0;
  const hasInstagramContent = content.instagram.length > 0;
  const isYoutubeConnected = !!user.socialAccounts?.youtube?.accessToken;
  const isInstagramConnected = !!user.socialAccounts?.instagram?.accessToken; // Assuming accessToken exists for IG too

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        {/* Use a more descriptive welcome or just the name */} 
        <div className="welcome-box">
          <h1>Welcome, {user.fullName}!</h1>
          {user.bio && <p className="user-bio">{user.bio}</p>}
        </div>
        <button className="logout-btn" onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/';
        }}>Logout</button>
      </header>

      <div className="dashboard-content">
        <section className="mentor-recommendations">
          <MentorList reflections={reflections} socialContent={content} />
        </section>

        {/* Display Liked Content Globe Animation */}
        {content.likedContent.length > 0 && (
          <section className="liked-content-globe">
            <AnimatedGlobe likedContent={content.likedContent} />
          </section>
        )}

        <section className="reflection-section">
          <GeminiReflectionForm onReflectionSubmitted={() => {
            const token = localStorage.getItem('token');
            if (token) fetchReflections(token);
          }} />
        </section>

        {reflections.length > 0 && (
          <section className="reflections-wall">
            <h2>Your Reflection History</h2>
            <ReflectionWall reflections={reflections} />
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;