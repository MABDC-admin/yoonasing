import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Mic, LayoutGrid, Play, Power, Search } from 'lucide-react';
import YouTubePlayer from './components/YouTubePlayer';
import SongSearch from './components/SongSearch';
import Queue from './components/Queue';
import PitchDetector from './components/PitchDetector';

// In production (when hosted on Coolify), we use relative paths ('') so requests go through Nginx proxy
// In local development, we fallback to localhost:4000
const isProd = import.meta.env.PROD;
const BACKEND_URL = isProd ? '' : 'http://localhost:4000';

function App() {
  const [visitorId, setVisitorId] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [socket, setSocket] = useState(null);
  
  const [queue, setQueue] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const remoteId = urlParams.get('remote');
    
    let vid;
    if (remoteId) {
      setIsRemote(true);
      vid = remoteId;
    } else {
      vid = localStorage.getItem('visitorID') || Math.random().toString(36).substring(2, 10);
      localStorage.setItem('visitorID', vid);
    }
    setVisitorId(vid);

    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinRoom', vid);
    });

    newSocket.on('syncState', (state) => {
      setQueue(state.queue || []);
      setCurrentVideo(state.currentVideo || null);
    });

    if (remoteId) {
      newSocket.emit('requestSync', vid);
    }

    return () => newSocket.close();
  }, []);

  const syncToRoom = (newQueue, newCurrent) => {
    if (socket) {
      socket.emit('updateState', {
        roomId: visitorId,
        queue: newQueue,
        currentVideo: newCurrent
      });
    }
  };

  const handleAddSong = (video) => {
    const newQueue = [...queue, video];
    setQueue(newQueue);
    syncToRoom(newQueue, currentVideo);
    
    if (!currentVideo && !isRemote) {
      playNext(newQueue);
    }
  };

  const handleRemoveSong = (index) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    syncToRoom(newQueue, currentVideo);
  };

  const handlePlaySong = (index) => {
    const video = queue[index];
    const newQueue = queue.filter((_, i) => i !== index);
    setCurrentVideo(video);
    setQueue(newQueue);
    syncToRoom(newQueue, video);
  };

  const playNext = (currentQueue = queue) => {
    if (currentQueue.length > 0) {
      const nextVideo = currentQueue[0];
      const newQueue = currentQueue.slice(1);
      setCurrentVideo(nextVideo);
      setQueue(newQueue);
      syncToRoom(newQueue, nextVideo);
    } else {
      setCurrentVideo(null);
      syncToRoom([], null);
    }
  };

  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {}
    };
    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });
  }, []);

  if (isRemote) {
    return (
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: '800' }}><span className="logo-blue">Yoona</span><span className="logo-red">Sing</span> Remote</h2>
        <SongSearch onAddSong={handleAddSong} />
        <Queue 
          queue={queue} 
          currentVideo={currentVideo}
          onPlaySong={handlePlaySong}
          onRemoveSong={handleRemoveSong}
        />
      </div>
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="logo-container">
          <Mic color="#ef4444" size={24} />
          <span><span className="logo-blue">Yoona</span><span className="logo-red">Sing</span></span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
          <Search size={20} />
          <LayoutGrid size={20} />
        </div>
      </header>

      <div className="main-content">
        <div className="video-section">
          <YouTubePlayer 
            videoId={currentVideo?.id?.videoId} 
            onEnd={() => playNext()}
          />
          <PitchDetector isPlaying={!!currentVideo && !isRemote} />
        </div>
        
        <div className="sidebar-section panel">
          <div className="controls-row">
            <SongSearch onAddSong={handleAddSong} />
            <button className="btn btn-icon btn-success"><Play size={16} fill="white" /></button>
            <button className="btn btn-icon btn-danger"><Power size={16} /></button>
          </div>
          
          <Queue 
            queue={queue} 
            currentVideo={currentVideo}
            onPlaySong={handlePlaySong}
            onRemoveSong={handleRemoveSong}
          />
        </div>
      </div>

      <div className="chatbot-bubble">
        Can't decide on a song? Let me help!
      </div>
      <div className="chatbot-icon">
        🎵
      </div>
    </>
  );
}

export default App;
