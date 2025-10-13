import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface PanelState {
  visible: boolean;
  transform: string;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private panelState = new Subject<PanelState>();
  public panelState$ = this.panelState.asObservable();

  updatePanelState(state: PanelState) {
    this.panelState.next(state);
  }
}
