import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue.component.html'
})
export class QueueComponent {
  @Input() queue: any[] = [];
  @Input() currentVideo: any = null;

  @Output() playSong = new EventEmitter<number>();
  @Output() removeSong = new EventEmitter<number>();
}
