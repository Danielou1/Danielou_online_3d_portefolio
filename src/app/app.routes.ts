import { Routes } from '@angular/router';

import { ProfilComponent } from './components/profil/profil.component';
import { DatenComponent } from './components/daten/daten.component';
import { SkillsComponent } from './components/skills/skills.component';
import { SoftskillsComponent } from './components/softskills/softskills.component';
import { SprachenComponent } from './components/sprachen/sprachen.component';
import { AkademischComponent } from './components/akademisch/akademisch.component';
import { ProjekteComponent } from './components/projekte/projekte.component';
import { ErfahrungComponent } from './components/erfahrung/erfahrung.component';
import { ThreeSceneComponent } from './three-scene/three-scene.component';
import { GiantScreenComponent } from './components/giant-screen/giant-screen.component';

export const routes: Routes = [
  { path: '', component: ThreeSceneComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'daten', component: DatenComponent },
  { path: 'skills', component: SkillsComponent },
  { path: 'softskills', component: SoftskillsComponent },
  { path: 'sprachen', component: SprachenComponent },
  { path: 'akademisch', component: AkademischComponent },
  { path: 'projekte', component: ProjekteComponent },
  { path: 'erfahrung', component: ErfahrungComponent },
  { path: '**', redirectTo: '' },
  {
  path: 'screen',
  loadComponent: () =>
    import('./components/giant-screen/giant-screen.component').then(m => m.GiantScreenComponent)
}

];
