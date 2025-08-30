import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class SceneControlService {
  private zoomRequestSource = new Subject<THREE.Object3D | string>();

  zoomRequest$ = this.zoomRequestSource.asObservable();

  requestZoom(target: THREE.Object3D | string) {
    this.zoomRequestSource.next(target);
  }
}
