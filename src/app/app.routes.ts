import { Routes } from '@angular/router';

import { ProfilComponent } from './components/profil/profil.component';
import { DatenComponent } from './components/daten/daten.component';
import { SkillsComponent } from './components/skills/skills.component';
import { SoftskillsComponent } from './components/softskills/softskills.component';
import { SprachenComponent } from './components/sprachen/sprachen.component';
import { AkademischComponent } from './components/akademisch/akademisch.component';
import { ProjekteComponent } from './components/projekte/projekte.component';
import { ErfahrungComponent } from './components/erfahrung/erfahrung.component';

export const routes: Routes = [
  { path: '', redirectTo: 'profil', pathMatch: 'full' }, // Redirect to profil by default
  { path: 'profil', component: ProfilComponent },
  { path: 'daten', component: DatenComponent },
  { path: 'skills', component: SkillsComponent },
  { path: 'softskills', component: SoftskillsComponent },
  { path: 'sprachen', component: SprachenComponent },
  { path: 'akademisch', component: AkademischComponent },
  { path: 'projekte', component: ProjekteComponent },
  { path: 'erfahrung', component: ErfahrungComponent },
  {
    path: 'screen',
    loadComponent: () =>
      import('./components/giant-screen/giant-screen.component').then(m => m.GiantScreenComponent)
  },
  { path: '**', redirectTo: 'profil' } // Redirect any other route to profil
];
