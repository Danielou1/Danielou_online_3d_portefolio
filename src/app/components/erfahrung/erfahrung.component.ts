import { Component } from '@angular/core';
import { SceneControlService } from '../../scene-control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-erfahrung',
  standalone: true,
  imports: [],
  templateUrl: './erfahrung.component.html',
  styleUrl: './erfahrung.component.css'
})
export class ErfahrungComponent {
  constructor(private sceneControlService: SceneControlService, private router: Router) {}

  goBack() {
    this.sceneControlService.requestZoom('screen');
  }
}
