import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from '../../language.service';

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
      title: 'Akademischer Werdegang',
      timeline: [
        {
          institution: 'Technische Hochschule Mittelhessen',
          date: 'Okt 2022 - Laufend',
          degree: 'Bachelor of Science, Ingenieur-Informatik',
          description: 'Spezialisierung auf Embedded Systems und industrielle Softwareentwicklung.'
        },
        {
          institution: 'Goethe-Institut Kamerun',
          date: 'Sep 2019 - Aug 2021',
          degree: 'Deutsch Sprachkurs (A1 - C1)',
          description: 'Erfolgreicher Abschluss mit TestDaF-Zertifikat als Qualifikation für das Hochschulstudium in Deutschland.'
        },
        {
          institution: 'Collège Bilingue Jacques de Bernon, Kribi',
          date: 'Sep 2003 - Aug 2019',
          degree: 'Abitur (Baccalauréat Scientifique)',
          description: 'Schwerpunkte in Mathematik, Physik und Informatik.'
        }
      ]
    },
    en: {
      title: 'Academic Journey',
      timeline: [
        {
          institution: 'University of Applied Sciences Mittelhessen (THM)',
          date: 'Oct 2022 - Present',
          degree: 'Bachelor of Science, Engineering & Computer Science',
          description: 'Specializing in Embedded Systems and Industrial Software Development.'
        },
        {
          institution: 'Goethe-Institut Cameroon',
          date: 'Sep 2019 - Aug 2021',
          degree: 'German Language Course (A1 - C1)',
          description: 'Successfully completed with the TestDaF certificate, qualifying for university studies in Germany.'
        },
        {
          institution: 'Collège Bilingue Jacques de Bernon, Kribi',
          date: 'Sep 2003 - Aug 2019',
          degree: 'High School Diploma (Scientific Baccalaureate)',
          description: 'Focus on Mathematics, Physics, and Computer Science.'
        }
      ]
    }
  };

  constructor(public languageService: LanguageService) {}

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
}