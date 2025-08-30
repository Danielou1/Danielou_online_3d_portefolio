import { Component } from '@angular/core';
import { SceneControlService } from '../../scene-control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-daten',
  standalone: true, // ⚠️ Très important !
  templateUrl: './daten.component.html',
  styleUrls: ['./daten.component.css']
})
export class DatenComponent {
  constructor(private sceneControlService: SceneControlService, private router: Router) {}

  goBack() {
    this.sceneControlService.requestZoom('screen');
  }
}
