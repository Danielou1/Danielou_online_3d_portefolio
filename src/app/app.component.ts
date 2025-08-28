import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Import composants...
import { DatenComponent } from './components/daten/daten.component';
import { ProfilComponent } from './components/profil/profil.component';
import { SkillsComponent } from './components/skills/skills.component';
import { SoftskillsComponent } from './components/softskills/softskills.component';
import { SprachenComponent } from './components/sprachen/sprachen.component';
import { AkademischComponent } from './components/akademisch/akademisch.component';
import { ProjekteComponent } from './components/projekte/projekte.component';
import { ErfahrungComponent } from './components/erfahrung/erfahrung.component';
import { ThreeSceneComponent } from './three-scene/three-scene.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DatenComponent,
    ProfilComponent,
    SkillsComponent,
    SoftskillsComponent,
    SprachenComponent,
    AkademischComponent,
    ProjekteComponent,
    ErfahrungComponent,
    ThreeSceneComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'danielou-portfolio';

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') {
      return; // Sécurité SSR
    }

    setTimeout(() => {
      const cards = document.querySelectorAll<HTMLElement>('.card-3d');

      cards.forEach(card => {
        card.style.perspective = '1000px'; // ajoute une perspective pour 3D plus réaliste

        card.addEventListener('mousemove', (e) => {
          const event = e as MouseEvent;
          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = (y - centerY) / 10;
          const rotateY = (x - centerX) / 10;

          card.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
          card.style.transition = 'transform 0.1s ease';
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'rotateX(0deg) rotateY(0deg)';
          card.style.transition = 'transform 0.3s ease';
        });
      });
    }, 0);
  }
}
