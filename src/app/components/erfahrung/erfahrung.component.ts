import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from '../../language.service';
import { SceneControlService } from '../../scene-control.service';

@Component({
  selector: 'app-erfahrung',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './erfahrung.component.html',
  styleUrls: ['./erfahrung.component.css']
})
export class ErfahrungComponent implements OnInit, OnDestroy {

  currentLanguage: Language = 'de';
  private langSub!: Subscription;

  experienceData = {
    de: {
      title: 'Berufserfahrung',
      timeline: [
        {
          title: 'Werkstudent Softwareentwicklung',
          company: 'Continental AG',
          location: 'Frankfurt am Main, Deutschland',
          date: 'März 2024 - Laufend',
          description: 'Entwicklung und Wartung von Softwaretools für die Automobilindustrie. Fokus auf C++ und Python in einem agilen Umfeld.'
        },
        {
          title: 'Praktikant Softwareentwicklung',
          company: 'Continental AG',
          location: 'Frankfurt am Main, Deutschland',
          date: 'Sep 2023 - Feb 2024',
          description: 'Mitarbeit an der Entwicklung von Embedded-Software für Steuergeräte. Erlernen von Automotive SPICE und funktionaler Sicherheit.'
        },
        {
          title: 'IT-Support & Systemadministration',
          company: 'THM - Technische Hochschule Mittelhessen',
          location: 'Gießen, Deutschland',
          date: 'Okt 2022 - Aug 2023',
          description: 'Unterstützung der Studierenden und Mitarbeiter bei IT-Problemen, Wartung von Hard- und Software.'
        }
      ]
    },
    en: {
      title: 'Work Experience',
      timeline: [
        {
          title: 'Working Student Software Development',
          company: 'Continental AG',
          location: 'Frankfurt am Main, Germany',
          date: 'March 2024 - Present',
          description: 'Development and maintenance of software tools for the automotive industry. Focus on C++ and Python in an agile environment.'
        },
        {
          title: 'Software Development Intern',
          company: 'Continental AG',
          location: 'Frankfurt am Main, Germany',
          date: 'Sep 2023 - Feb 2024',
          description: 'Assisted in the development of embedded software for control units. Gained experience with Automotive SPICE and functional safety.'
        },
        {
          title: 'IT Support & System Administration',
          company: 'THM - Technical University of Central Hesse',
          location: 'Giessen, Germany',
          date: 'Oct 2022 - Aug 2023',
          description: 'Provided IT support to students and staff, maintained hardware and software.'
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