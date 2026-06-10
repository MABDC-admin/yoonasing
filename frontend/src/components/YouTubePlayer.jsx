import React, { useEffect, useRef, useState } from 'react';

export default function YouTubePlayer({ videoId, onEnd }) {
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      playerRef.current = new window.YT.Player(iframeRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1, // Retain seek duration
          rel: 0, // Prevent random related videos
          enablejsapi: 1,
          modestbranding: 1,
          fs: 0, // Disable fullscreen button
          iv_load_policy: 3, // Disable annotations
          disablekb: 1 // Disable keyboard shortcuts
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: (e) => {
            // When video ends, immediately trigger next song
            if (e.data === window.YT.PlayerState.ENDED) {
              // Hide player immediately to prevent the related video grid from showing
              if (iframeRef.current) iframeRef.current.style.opacity = '0';
              if (onEnd) onEnd();
            }
            // Fade back in when playing
            if (e.data === window.YT.PlayerState.PLAYING) {
              if (iframeRef.current) iframeRef.current.style.opacity = '1';
            }
          }
        }
      });
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isReady && playerRef.current) {
      if (videoId) {
        playerRef.current.loadVideoById(videoId);
      } else {
        // Stop the video entirely if the queue is empty
        playerRef.current.stopVideo();
      }
    }
  }, [videoId, isReady]);

  useEffect(() => {
    // Hack to remove youtube pause overlay
    const removeOverlays = () => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        try {
          const overlay1 = iframe.contentDocument.querySelector('.ytp-pause-overlay');
          const overlay2 = iframe.contentDocument.querySelector('.ytp-pause-overlay-container');
          if (overlay1) overlay1.style.display = 'none';
          if (overlay2) overlay2.style.display = 'none';
        } catch(e) {
          // CORS might block this depending on browser, but we try
        }
      }
    };
    const interval = setInterval(removeOverlays, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      backgroundColor: '#000', 
      borderRadius: '8px', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
      {!videoId && (
        <div style={{ color: '#fff', opacity: 0.5 }}>
          <h2>No video selected</h2>
        </div>
      )}
      
      {/* 
        This black box specifically targets the bottom-right area just above the control bar.
        It masks the "More videos" popup and the YouTube watermark logo.
      */}
      {videoId && (
        <div style={{
          position: 'absolute',
          bottom: '30px', 
          right: '0',
          width: '280px',
          height: '75px',
          backgroundColor: '#000',
          zIndex: 10,
          pointerEvents: 'none'
        }}></div>
      )}

      {/* 
        The CSS transform hack below scales the iframe vertically and shifts it up. 
        height: 110% and marginTop: -10% perfectly crops out the top Title Bar, 
        while keeping the bottom aligned perfectly so the seek bar remains fully visible!
      */}
      <div 
        ref={iframeRef} 
        style={{ 
          width: '100%', 
          height: '110%', 
          marginTop: '-10%',
          display: videoId ? 'block' : 'none',
          transition: 'opacity 0.2s ease-in-out'
        }}
      ></div>
    </div>
  );
}
