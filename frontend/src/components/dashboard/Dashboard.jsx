import { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  // Update state to hold separate content types
  const [content, setContent] = useState({
    likedVideos: [],
    playlists: [],
    uploadedVideos: [],
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
          likedVideos: [],
          playlists: [],
          uploadedVideos: [],
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
                likedVideos: youtubeData.likedVideos || [],
                playlists: youtubeData.playlists || [],
                uploadedVideos: youtubeData.uploadedVideos || []
              }));
              // Store potential errors from the backend response
              const ytErrors = [
                youtubeData.likedVideosError,
                youtubeData.playlistsError,
                youtubeData.uploadedVideosError
              ].filter(Boolean).join(' ');
              if (ytErrors) {
                setContentErrors(prev => ({ ...prev, youtube: ytErrors }));
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
  const hasYoutubeContent = content.likedVideos.length > 0 || content.playlists.length > 0 || content.uploadedVideos.length > 0;
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

        {/* YouTube Liked Videos */} 
        {content.likedVideos.length > 0 && (
          <div className="content-grid youtube-content">
            <h3>Liked Videos</h3>
            <div className="grid">
              {content.likedVideos.map(video => (
                <div key={video.id} className="content-card youtube-card">
                  <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                    <img src={video.thumbnail} alt={video.title} />
                    <h4>{video.title}</h4>
                  </a>
                  <p className="video-details">{video.channelTitle}</p>
                  {/* Add more details if needed, e.g., view count */} 
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YouTube Playlists */} 
        {content.playlists.length > 0 && (
          <div className="content-grid youtube-content">
            <h3>Your Playlists</h3>
            <div className="grid">
              {content.playlists.map(playlist => (
                <div key={playlist.id} className="content-card youtube-card">
                   <a href={`https://www.youtube.com/playlist?list=${playlist.id}`} target="_blank" rel="noopener noreferrer">
                    <img src={playlist.thumbnail} alt={playlist.title} />
                    <h4>{playlist.title}</h4>
                  </a>
                  <p className="video-details">{playlist.itemCount} videos</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YouTube Uploaded Videos */} 
        {content.uploadedVideos.length > 0 && (
          <div className="content-grid youtube-content">
            <h3>Your Uploads</h3>
            <div className="grid">
              {content.uploadedVideos.map(video => (
                <div key={video.id} className="content-card youtube-card">
                  <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                    <img src={video.thumbnail} alt={video.title} />
                    <h4>{video.title}</h4>
                  </a>
                  {/* Add published date or other details */} 
                  <p className="video-details">Published: {new Date(video.publishedAt).toLocaleDateString()}</p>
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