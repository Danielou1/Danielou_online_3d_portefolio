import { Component } from '@angular/core';
import { SceneControlService } from '../../scene-control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css'
})
export class ProfilComponent {
  constructor(private sceneControlService: SceneControlService, private router: Router) {}

  goBack() {
    this.sceneControlService.requestZoom('screen');
  }
}
