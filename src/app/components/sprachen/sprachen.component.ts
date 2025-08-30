import { Component } from '@angular/core';
import { SceneControlService } from '../../scene-control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sprachen',
  standalone: true,
  imports: [],
  templateUrl: './sprachen.component.html',
  styleUrl: './sprachen.component.css'
})
export class SprachenComponent {
  constructor(private sceneControlService: SceneControlService, private router: Router) {}

  goBack() {
    this.sceneControlService.requestZoom('screen');
  }
}

