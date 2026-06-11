import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

const isProd = import.meta.env.PROD;
const BACKEND_URL = isProd ? '' : 'http://localhost:4000';

export default function SongSearch({ onAddSong }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const searchSongs = async (e) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    const searchQuery = query.toLowerCase().includes('karaoke') ? query : query + ' karaoke';
    
    try {
      // Call our backend proxy instead of YouTube directly.
      // The API key lives on the server — never exposed to the browser.
      const res = await fetch(`${BACKEND_URL}/api/youtube/search?q=${encodeURIComponent(searchQuery)}&maxResults=10`);
      const data = await res.json();
      
      if (data.items) {
        setResults(data.items);
      }
    } catch (err) {
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', flex: 1 }} ref={dropdownRef}>
      <form onSubmit={searchSongs} className="search-input-group">
        <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--text-muted)' }}>
          <Search size={16} />
        </button>
        <input 
          type="text" 
          placeholder="Search" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-search" disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((video) => (
            <div key={video.id.videoId} className="queue-item" style={{ cursor: 'pointer' }} onClick={() => {
              onAddSong(video);
              setResults([]);
              setQuery('');
            }}>
              <img src={video.snippet.thumbnails.default.url} alt="thumbnail" className="queue-thumb" />
              <div className="queue-details">
                <div className="queue-title">{video.snippet.title}</div>
                <div className="queue-meta">
                  <span style={{ color: 'var(--text-muted)' }}>{video.snippet.channelTitle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
