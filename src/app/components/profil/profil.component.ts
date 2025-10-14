import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from '../../language.service';
import { SceneControlService } from '../../scene-control.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit, OnDestroy {
  
  currentLanguage: Language = 'de';
  private langSub!: Subscription;

  profileData = {
    de: {
      title: 'Profil',
      greeting: 'Hallo! Ich bin Daniel.',
      bio: `Als engagierter Informatikstudent an der Technischen Hochschule Mittelhessen, mit einer Leidenschaft für Embedded Systems und industrielle Softwareentwicklung, strebe ich danach, innovative Lösungen für komplexe Herausforderungen zu entwickeln. Mein Ziel ist es, meine Fähigkeiten in einem dynamischen und internationalen Umfeld einzusetzen und kontinuierlich zu erweitern.`,
      highlights: [
        { icon: '💻', text: 'Fundierte Kenntnisse in <strong>C/C++</strong> und <strong>Java</strong> für robuste Softwarelösungen.' },
        { icon: '🔧', text: 'Erfahrung mit <strong>Git</strong>, <strong>Docker</strong> und agilen Methoden für eine effiziente Entwicklung.' },
        { icon: '🔌', text: 'Kenntnisse in <strong>MQTT</strong>, I²C, SPI und Sensorintegration für IoT-Anwendungen.' },
        { icon: '🌍', text: 'Teamfähig und motiviert, in einem <strong>internationalen Umfeld</strong> zu wachsen.' }
      ]
    },
    en: {
      title: 'Profile',
      greeting: "Hello! I'm Daniel.",
      bio: `As a dedicated computer science student at the Technical University of Central Hesse (THM), with a passion for embedded systems and industrial software development, I strive to create innovative solutions for complex challenges. My goal is to apply and continuously expand my skills in a dynamic and international environment.`,
      highlights: [
        { icon: '💻', text: 'Profound knowledge in <strong>C/C++</strong> and <strong>Java</strong> for robust software solutions.' },
        { icon: '🔧', text: 'Experience with <strong>Git</strong>, <strong>Docker</strong>, and agile methodologies for efficient development.' },
        { icon: '🔌', text: 'Knowledge in <strong>MQTT</strong>, I²C, SPI, and sensor integration for IoT applications.' },
        { icon: '🌍', text: 'A team player, motivated to grow in an <strong>international environment</strong>.' }
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
