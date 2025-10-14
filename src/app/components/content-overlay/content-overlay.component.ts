import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-content-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-overlay.component.html',
  styleUrls: ['./content-overlay.component.css']
})
export class ContentOverlayComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
