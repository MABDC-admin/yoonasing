import React from 'react';
import { Play, X } from 'lucide-react';

export default function Queue({ queue, currentVideo, onPlaySong, onRemoveSong }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="queue-header">
        <span>QUEUE</span>
        {queue.length > 0 && <span className="queue-badge">{queue.length}</span>}
      </div>

      <div className="queue-list">
        {currentVideo && (
          <div className="queue-item" style={{ background: '#f8fafc' }}>
            <img src={currentVideo.snippet.thumbnails.default.url} alt="thumb" className="queue-thumb" />
            <div className="queue-details">
              <div className="queue-meta">
                <Play size={10} fill="var(--primary)" color="var(--primary)" />
                <span style={{ color: 'var(--primary)' }}>NOW PLAYING</span>
              </div>
              <div className="queue-title">{currentVideo.snippet.title}</div>
            </div>
          </div>
        )}

        {queue.length === 0 && !currentVideo && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Queue is empty.
          </div>
        )}

        {queue.map((video, index) => (
          <div key={`${video.id.videoId}-${index}`} className="queue-item">
            <img src={video.snippet.thumbnails.default.url} alt="thumb" className="queue-thumb" />
            
            <div className="queue-details">
              <div className="queue-meta">
                <span style={{ color: 'var(--text-muted)' }}>UNSTARTED</span>
              </div>
              <div className="queue-title">{video.snippet.title}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button className="btn" style={{ padding: '0.25rem', color: 'var(--success)' }} onClick={() => onPlaySong(index)}>
                <Play size={14} />
              </button>
              <button className="btn" style={{ padding: '0.25rem', color: 'var(--danger)' }} onClick={() => onRemoveSong(index)}>
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
