import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SyncService, PanelState } from './sync.service';
import { ProfilComponent } from './components/profil/profil.component';
import { SkillsComponent } from './components/skills/skills.component';
import { SoftskillsComponent } from './components/softskills/softskills.component';
import { SprachenComponent } from './components/sprachen/sprachen.component';
import { AkademischComponent } from './components/akademisch/akademisch.component';
import { ProjekteComponent } from './components/projekte/projekte.component';
import { ErfahrungComponent } from './components/erfahrung/erfahrung.component';
import { DatenComponent } from './components/daten/daten.component';
import { ThreeSceneComponent } from './three-scene/three-scene.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    ThreeSceneComponent,
    ProfilComponent, // Re-add all routable components
    SkillsComponent,
    SoftskillsComponent,
    SprachenComponent,
    AkademischComponent,
    ProjekteComponent,
    ErfahrungComponent,
    DatenComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'danielou-portfolio';
  panelState: PanelState = { visible: false, transform: '' };
  private panelSub!: Subscription;

  constructor(private syncService: SyncService) {}

  ngOnInit(): void {
    this.panelSub = this.syncService.panelState$.subscribe(state => {
      this.panelState = state;
    });
  }

  ngOnDestroy(): void {
    if (this.panelSub) {
      this.panelSub.unsubscribe();
    }
  }
}