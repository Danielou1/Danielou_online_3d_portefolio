import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from '../../language.service';
import { SceneControlService } from '../../scene-control.service';

@Component({
  selector: 'app-akademisch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './akademisch.component.html',
  styleUrls: ['./akademisch.component.css']
})
export class AkademischComponent implements OnInit, OnDestroy {

  currentLanguage: Language = 'de';
  private langSub!: Subscription;

  academicData = {
    de: {
      title: 'Akademische Laufbahn',
      timeline: [
        {
          degree: 'Bachelor of Science: Ingenieur-Informatik',
          institution: 'Technische Hochschule Mittelhessen (THM)',
          date: 'Okt 2022 - Dez 2025',
          description: 'Praxisnahes Studium mit Fokus auf Software-Engineering, Algorithmen, objektorientierte Programmierung (Java, C++), Datenbanken (SQL), Web-Technologien und Embedded Systems.'
        },
        {
          degree: 'Deutsch-Sprachkurs (A1-C1) mit TestDaF-Zertifikat',
          institution: 'Goethe-Institut',
          date: 'Sep 2019 - Aug 2021',
          description: 'Intensivkurs zur Erlangung der sprachlichen Hochschulzugangsberechtigung für Deutschland.'
        },
        {
          degree: 'Allgemeine Hochschulreife (Abitur)',
          institution: 'Collège Bilingue de Kribi',
          date: 'Sep 2003 - Aug 2019',
          description: 'Abschluss mit Leistungskursen in Mathematik, Physik und Informatik als solide Grundlage für ein Ingenieurstudium.'
        }
      ]
    },
    en: {
      title: 'Education',
      timeline: [
        {
          degree: 'Bachelor of Engineering: Applied Computer Science',
          institution: 'THM - University of Applied Sciences',
          date: 'Oct 2022 - Dec 2025',
          description: 'Hands-on studies focusing on Software Engineering, Algorithms, Object-Oriented Programming (Java, C++), Databases (SQL), Web Technologies, and Embedded Systems.'
        },
        {
          degree: 'German Language Course (A1-C1) with TestDaF Certificate',
          institution: 'Goethe-Institut',
          date: 'Sep 2019 - Aug 2021',
          description: 'Intensive course to obtain the language proficiency required for university admission in Germany.'
        },
        {
          degree: 'General University Entrance Qualification (Abitur)',
          institution: 'Collège Bilingue de Kribi',
          date: 'Sep 2003 - Aug 2019',
          description: 'Graduated with advanced courses in Mathematics, Physics, and Computer Science, providing a strong foundation for engineering studies.'
        }
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
