import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'de' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private language = new BehaviorSubject<Language>('de');
  public language$ = this.language.asObservable();

  constructor() { }

  toggleLanguage(): void {
    const nextLanguage = this.language.value === 'de' ? 'en' : 'de';
    this.language.next(nextLanguage);
  }

  setLanguage(lang: Language): void {
    this.language.next(lang);
  }
}
