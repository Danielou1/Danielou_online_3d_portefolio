import { Component } from '@angular/core';
import { SceneControlService } from '../../scene-control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projekte',
  standalone: true,
  imports: [],
  templateUrl: './projekte.component.html',
  styleUrl: './projekte.component.css'
})
export class ProjekteComponent {
  constructor(private sceneControlService: SceneControlService, private router: Router) {}

  goBack() {
    this.sceneControlService.requestZoom('screen');
  }
}
