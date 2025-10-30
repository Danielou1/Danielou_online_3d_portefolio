import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Language, LanguageService } from './language.service';
import { SceneControlService } from './scene-control.service';
import { HttpClient } from '@angular/common/http';

// L'objet retourné par le service
export interface BotResponse {
  text: string;
  navigationTarget?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private currentLanguage: Language = 'de';

  constructor(
    private languageService: LanguageService, 
    private sceneControlService: SceneControlService,
    private router: Router,
    private http: HttpClient
  ) {
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  public triggerNavigation(target: string): void {
    this.router.navigate([`/${target.toLowerCase()}`]);
    this.sceneControlService.requestZoom('screen');
  }

  public getAnswer(question: string): Observable<BotResponse> {
    const apiUrl = '/api/chat';
    const body = { message: question, lang: this.currentLanguage };

    return this.http.post<{ reply: string }>(apiUrl, body).pipe(
      map(response => ({ text: response.reply }))
    );
  }
}
