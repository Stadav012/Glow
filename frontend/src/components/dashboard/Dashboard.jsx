import { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
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
        const response = await fetch('http://localhost:5100/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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
      </header>

      <section className="content-section">
        <h2>Your Content</h2>

        {/* Display YouTube Fetch Errors */}
        {contentErrors.youtube && <p className="connection-status error-message">YouTube Error: {contentErrors.youtube}</p>}

        {/* YouTube Liked Content */} 
        {content.likedContent.length > 0 && (
          <div className="content-grid youtube-content">
            <h3>Liked Content</h3>
            <div className="grid">
              {content.likedContent.map(item => (
                <div key={item.id} className="content-card youtube-card">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} />}
                    <h4>{item.title}</h4>
                  </a>
                  <p className="video-details">{item.channelTitle}</p>
                  {/* Add more details if needed, e.g., likedAt (placeholder) */} 
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Posts (Uploads) */} 
        {content.posts.length > 0 && (
          <div className="content-grid youtube-content">
            <h3>Your Posts</h3>
            <div className="grid">
              {content.posts.map(post => (
                <div key={post.id} className="content-card youtube-card">
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    {post.thumbnail && <img src={post.thumbnail} alt={post.title} />}
                    <h4>{post.title}</h4>
                  </a>
                  {/* Add published date or other details */} 
                  {post.publishedAt && <p className="video-details">Published: {new Date(post.publishedAt).toLocaleDateString()}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display Instagram Fetch Errors */} 
        {contentErrors.instagram && <p className="connection-status error-message">Instagram Error: {contentErrors.instagram}</p>}

        {/* Instagram Content (Keep existing structure) */} 
        {hasInstagramContent && (
          <div className="content-grid instagram-content">
            <h3>Instagram Posts</h3>
            <div className="grid">
              {content.instagram.map(post => (
                <div key={post.id} className="content-card instagram-card">
                  {/* Link to post if possible */} 
                  <img src={post.mediaUrl} alt={post.caption || 'Instagram Post'} />
                  {post.caption && <p>{post.caption}</p>}
                  {/* Display likes/timestamp if available */} 
                  {/* <span>{post.likes} likes • {post.timestamp}</span> */} 
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Status & No Content Messages */} 
        {!isYoutubeConnected && !isInstagramConnected ? (
          // Case 1: No accounts linked
          <div className="no-content">
            <p>Connect your social media accounts to see your content here.</p>
            <button onClick={() => window.location.href = '/auth'} className="connect-btn">
              Connect Accounts
            </button>
          </div>
        ) : (
          // Case 2: At least one account linked
          <>
            {isYoutubeConnected && !hasYoutubeContent && !contentErrors.youtube && (
              <p className="connection-status">YouTube connected, but no videos found or fetched yet.</p>
            )}
            {/* Add similar message for Instagram if needed */} 
            {isInstagramConnected && !hasInstagramContent && !contentErrors.instagram && (
              <p className="connection-status">Instagram connected, but no posts found or fetched yet.</p>
            )}
            {/* Optional: Add a button to re-sync or connect more accounts */} 
            {(!hasYoutubeContent || !hasInstagramContent) && (!contentErrors.youtube && !contentErrors.instagram) && (
                 <button onClick={() => window.location.href = '/auth'} className="connect-btn secondary">
                   Manage Connections
                 </button>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Dashboard;