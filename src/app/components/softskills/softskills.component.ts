import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from '../../language.service';
import { SceneControlService } from '../../scene-control.service';

@Component({
  selector: 'app-softskills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './softskills.component.html',
  styleUrls: ['./softskills.component.css']
})
export class SoftskillsComponent implements OnInit, OnDestroy {

  currentLanguage: Language = 'de';
  private langSub!: Subscription;

  softSkillsData = {
    de: {
      title: 'Soziale Kompetenzen',
      items: [
        { icon: '📖', name: 'Lernbereitschaft', description: 'Schnelle Aneignung neuer Technologien und Konzepte.' },
        { icon: '🤝', name: 'Teamarbeit', description: 'Effektive Zusammenarbeit in agilen und interdisziplinären Teams.' },
        { icon: '⏰', name: 'Zeitmanagement', description: 'Priorisierung von Aufgaben zur Einhaltung von Fristen.' },
        { icon: '💡', name: 'Kritisches Denken', description: 'Analytische Problemlösung und fundierte Entscheidungsfindung.' },
        { icon: '🗣️', name: 'Effektive Kommunikation', description: 'Klare Vermittlung komplexer technischer Informationen.' },
        { icon: '👨‍🏫', name: 'Leadership', description: 'Übernahme von Verantwortung und Motivation des Teams.' }
      ]
    },
    en: {
      title: 'Soft Skills',
      items: [
        { icon: '📖', name: 'Eagerness to Learn', description: 'Rapid acquisition of new technologies and concepts.' },
        { icon: '🤝', name: 'Teamwork', description: 'Effective collaboration in agile and interdisciplinary teams.' },
        { icon: '⏰', name: 'Time Management', description: 'Prioritizing tasks to meet deadlines effectively.' },
        { icon: '💡', name: 'Critical Thinking', description: 'Analytical problem-solving and informed decision-making.' },
        { icon: '🗣️', name: 'Effective Communication', description: 'Clearly conveying complex technical information.' },
        { icon: '👨‍🏫', name: 'Leadership', description: 'Taking responsibility and motivating the team.' }
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