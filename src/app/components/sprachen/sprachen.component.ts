import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from '../../language.service';
import { SceneControlService } from '../../scene-control.service';

@Component({
  selector: 'app-sprachen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sprachen.component.html',
  styleUrls: ['./sprachen.component.css']
})
export class SprachenComponent implements OnInit, OnDestroy {

  currentLanguage: Language = 'de';
  private langSub!: Subscription;

  languagesData = {
    de: {
      title: 'Sprachkenntnisse',
      items: [
        { name: 'Französisch', level: 'Muttersprache', description: 'C2 - Vollständige Beherrschung in allen Kontexten.' },
        { name: 'Deutsch', level: 'Verhandlungssicher', description: 'C1 - Fließend in beruflichen und akademischen Umgebungen.' },
        { name: 'Englisch', level: 'Gute Kenntnisse', description: 'B2 - Selbstständige und effektive Kommunikation.' }
      ]
    },
    en: {
      title: 'Languages',
      items: [
        { name: 'French', level: 'Native Speaker', description: 'C2 - Complete proficiency in all contexts.' },
        { name: 'German', level: 'Business Fluent', description: 'C1 - Fluent in professional and academic environments.' },
        { name: 'English', level: 'Proficient', description: 'B2 - Independent and effective communication.' }
      ]
    }
  };

  constructor(public languageService: LanguageService, private sceneControlService: SceneControlService) {}

  ngOnInit(): void {
    this.langSub = this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  goBack(): void {
    this.sceneControlService.requestCameraReset();
  }
}