import React, { useState } from 'react';

// MatchList component allows users to search mentors by tags and displays results in a responsive grid
export default function MatchList() {
  // State for the user-entered tags
  const [tagsInput, setTagsInput] = useState('');
  // State for storing fetched mentor matches
  const [matches, setMatches] = useState([]);
  // Loading state to manage UI during fetch
  const [loading, setLoading] = useState(false);

  /**
   * Fetch matching mentors from the backend based on tagsInput.
   * Encodes the input, handles loading state, and updates matches.
   */
  const fetchMatches = async () => {
    const tags = tagsInput.trim();
    if (!tags) return; // Prevent fetch if input is empty

    setLoading(true);
    try {
      const response = await fetch(
        `/api/mentor/match?tags=${encodeURIComponent(tags)}&minMatchScore=0.01`
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-center mb-8">Find Your Mentor</h1>

      {/* Search Input & Button */}
      <div className="flex items-center mb-6 space-x-4">
        <input
          type="text"
          placeholder="Enter tags: Design, AI, UX"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchMatches}
          disabled={loading}
          className={`px-6 py-3 rounded font-medium text-white ${
            loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
          } transition`}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* No Results Message */}
        {!loading && matches.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">
            No mentors found. Try different tags.
          </p>
        )}

        {/* Mentor Cards */}
        {matches.map((mentor) => (
          <div
            key={mentor.id}
            className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition"
          >
            {/* Mentor Name & Bio */}
            <h2 className="text-xl font-semibold mb-1">{mentor.name}</h2>
            <p className="text-sm italic text-gray-600 mb-3">{mentor.bio}</p>

            {/* Mentor Tags & Intro */}
            <p className="mb-2">
              <span className="font-medium">Tags:</span> {mentor.tags.join(', ')}
            </p>
            <p className="mb-4 text-gray-700">{mentor.intro}</p>

            {/* Connect Button */}
            <a
              href={mentor.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Connect
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
