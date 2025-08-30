import { Component } from '@angular/core';
import { SceneControlService } from '../../scene-control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-akademisch',
  standalone: true,
  imports: [],
  templateUrl: './akademisch.component.html',
  styleUrl: './akademisch.component.css'
})
export class AkademischComponent {
  constructor(private sceneControlService: SceneControlService, private router: Router) {}

  goBack() {
    this.sceneControlService.requestZoom('screen');
  }
}
