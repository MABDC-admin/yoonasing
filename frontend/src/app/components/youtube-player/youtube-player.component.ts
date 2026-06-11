import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

@Component({
  selector: 'app-youtube-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './youtube-player.component.html'
})
export class YoutubePlayerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() videoId: string | null = null;
  @Output() end = new EventEmitter<void>();

  @ViewChild('iframeContainer', { static: true }) iframeRef!: ElementRef;
  @ViewChild('playerWrapper', { static: true }) wrapperRef!: ElementRef;

  private player: any;
  private isReady = false;

  ngOnInit() {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        this.initPlayer();
      };
    } else {
      this.initPlayer();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isReady && this.player) {
      if (this.videoId) {
        this.player.loadVideoById(this.videoId);
      } else {
        this.player.stopVideo();
      }
    }
  }

  ngOnDestroy() {
    if (this.player && this.player.destroy) {
      this.player.destroy();
    }
  }

  private initPlayer() {
    this.player = new window.YT.Player(this.iframeRef.nativeElement, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        enablejsapi: 1,
        modestbranding: 1,
        fs: 0,
        iv_load_policy: 3,
        disablekb: 1
      },
      events: {
        onReady: () => {
          this.isReady = true;
          if (this.videoId) {
            this.player.loadVideoById(this.videoId);
          }
        },
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            if (this.wrapperRef?.nativeElement) {
              this.wrapperRef.nativeElement.style.opacity = '0';
            }
            this.end.emit();
          }
          if (e.data === window.YT.PlayerState.PLAYING) {
            if (this.wrapperRef?.nativeElement) {
              this.wrapperRef.nativeElement.style.opacity = '1';
            }
          }
        }
      }
    });
  }
}
