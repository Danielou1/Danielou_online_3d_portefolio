import { Component } from '@angular/core';
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
export class AppComponent {
  title = 'danielou-portfolio';
}