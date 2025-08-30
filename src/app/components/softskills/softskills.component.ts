import { Component } from '@angular/core';
import { SceneControlService } from '../../scene-control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-softskills',
  standalone: true,
  imports: [],
  templateUrl: './softskills.component.html',
  styleUrl: './softskills.component.css'
})
export class SoftskillsComponent {
  constructor(private sceneControlService: SceneControlService, private router: Router) {}

  goBack() {
    this.sceneControlService.requestZoom('screen');
  }
}
