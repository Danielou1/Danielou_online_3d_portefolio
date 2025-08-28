import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 Import important pour *ngSwitch
// autres imports si nécessaires...

@Component({
  selector: 'app-giant-screen',
  standalone: true,
  templateUrl: './giant-screen.component.html',
  styleUrls: ['./giant-screen.component.css'],
  imports: [CommonModule], // 👈 Ajoute ça si ce n’est pas là
})
export class GiantScreenComponent {
  @Input() activeSection: 'profil' | 'skills' | 'erfahrung' = 'profil';
  @Output() contentUpdated = new EventEmitter<void>();

  setSection(section: 'profil' | 'skills' | 'erfahrung') {
    this.activeSection = section;
    setTimeout(() => this.contentUpdated.emit(), 50); // petit délai pour laisser le DOM se mettre à jour
  }
}
