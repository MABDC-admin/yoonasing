import { Component, EventEmitter, Output, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../app-config.service';
import { LucideSearch } from '@lucide/angular';

@Component({
  selector: 'app-song-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch],
  templateUrl: './song-search.component.html',
  host: {
    'style': 'display: block; position: relative; flex: 1;'
  }
})
export class SongSearchComponent {
  @Output() addSong = new EventEmitter<any>();
  @ViewChild('dropdown') dropdownRef!: ElementRef;

  query = '';
  results: any[] = [];
  isSearching = false;
  showDropdown = false;

  constructor(private http: HttpClient, private configService: AppConfigService) {}

  async handleSearch(e?: Event) {
    if (e) {
      e.preventDefault();
    }
    if (!this.query.trim()) return;

    this.isSearching = true;
    this.showDropdown = true;
    
    try {
      const backendUrl = this.configService.backendUrl || '';
      const url = `${backendUrl}/api/youtube/search?q=${encodeURIComponent(this.query + ' karaoke')}`;
      
      const data = await this.http.get<any>(url).toPromise();
      if (data && data.items) {
        this.results = data.items.filter((item: any) => item.id.videoId);
      }
    } catch (err) {
      console.error('Error fetching songs:', err);
    } finally {
      this.isSearching = false;
    }
  }

  selectSong(video: any) {
    this.addSong.emit(video);
    this.showDropdown = false;
    this.query = '';
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
