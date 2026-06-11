import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { AppConfigService } from './app-config.service';

import { LucideMic, LucideLayoutGrid, LucidePlay, LucidePower, LucideSearch } from '@lucide/angular';
import { YoutubePlayerComponent } from './components/youtube-player/youtube-player.component';
import { SongSearchComponent } from './components/song-search/song-search.component';
import { QueueComponent } from './components/queue/queue.component';
import { PitchDetectorComponent } from './components/pitch-detector/pitch-detector.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    LucideMic, 
    LucideLayoutGrid, 
    LucidePlay, 
    LucidePower, 
    LucideSearch, 
    YoutubePlayerComponent, 
    SongSearchComponent, 
    QueueComponent, 
    PitchDetectorComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  visitorId = '';
  isRemote = false;
  private socket: Socket | null = null;

  queue: any[] = [];
  currentVideo: any = null;

  constructor(private configService: AppConfigService) {}

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    const remoteId = urlParams.get('remote');

    if (remoteId) {
      this.isRemote = true;
      this.visitorId = remoteId;
    } else {
      let vid = localStorage.getItem('visitorID');
      if (!vid) {
        vid = Math.random().toString(36).substring(2, 10);
        localStorage.setItem('visitorID', vid);
      }
      this.visitorId = vid;
    }

    const backendUrl = this.configService.backendUrl || '';
    this.socket = io(backendUrl || '/');

    this.socket.on('connect', () => {
      this.socket?.emit('joinRoom', this.visitorId);
    });

    this.socket.on('syncState', (state: any) => {
      this.queue = state.queue || [];
      this.currentVideo = state.currentVideo || null;
    });

    if (remoteId) {
      this.socket.emit('requestSync', this.visitorId);
    }

    this.requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.requestWakeLock();
      }
    });
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.close();
    }
  }

  private async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {}
  }

  private syncToRoom(newQueue: any[], newCurrent: any) {
    if (this.socket) {
      this.socket.emit('updateState', {
        roomId: this.visitorId,
        queue: newQueue,
        currentVideo: newCurrent
      });
    }
  }

  handleAddSong(video: any) {
    const newQueue = [...this.queue, video];
    this.queue = newQueue;
    this.syncToRoom(newQueue, this.currentVideo);

    if (!this.currentVideo && !this.isRemote) {
      this.playNext(newQueue);
    }
  }

  handleRemoveSong(index: number) {
    const newQueue = this.queue.filter((_, i) => i !== index);
    this.queue = newQueue;
    this.syncToRoom(newQueue, this.currentVideo);
  }

  handlePlaySong(index: number) {
    const video = this.queue[index];
    const newQueue = this.queue.filter((_, i) => i !== index);
    this.currentVideo = video;
    this.queue = newQueue;
    this.syncToRoom(newQueue, video);
  }

  playNext(currentQueue = this.queue) {
    if (currentQueue.length > 0) {
      const nextVideo = currentQueue[0];
      const newQueue = currentQueue.slice(1);
      this.currentVideo = nextVideo;
      this.queue = newQueue;
      this.syncToRoom(newQueue, nextVideo);
    } else {
      this.currentVideo = null;
      this.syncToRoom([], null);
    }
  }
}
