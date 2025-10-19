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
          title: 'Forschung & Entwicklung im Bereich Embedded Systems',
          company: 'Technische Hochschule Mittelhessen',
          location: 'Gießen, Deutschland',
          date: 'Oktober 2023 - Laufend',
          description: 'Mitarbeit an einem Forschungsprojekt zur Entwicklung eines Microcontroller-basierten Remote-Labors. Meine Aufgaben umfassen die Implementierung, das Testen und die Optimierung von Embedded-Systemen, um eine zuverlässige und performante Fernsteuerung der Laborumgebung zu gewährleisten.'
        },
        {
          title: 'Verwaltungsunterstützung & Sprachmittlung',
          company: 'Bundesamt für Migration und Flüchtlinge (BAMF)',
          location: 'Gießen, Deutschland',
          date: '2023 - Laufend',
          description: 'Als Dolmetscher unterstütze ich bei Anhörungen und erstelle präzise schriftliche Übersetzungen. Zudem bin ich für die Aktenanlage und die Unterstützung allgemeiner Verwaltungsprozesse zuständig, um eine reibungslose Kommunikation zwischen der Behörde und den Antragstellern sicherzustellen.'
        },
        {
          title: 'Verbundzusteller',
          company: 'Deutsche Post DHL',
          location: 'Deutschland',
          date: 'Juni 2022 - Laufend',
          description: 'Als Zusteller bei der Deutschen Post DHL bin ich für die zuverlässige Lieferung von Briefen und Paketen verantwortlich. Diese Rolle erfordert ein hohes Maß an Eigenorganisation und Zeitmanagement. Ein wesentlicher Teil meiner Tätigkeit ist die ständige Interaktion mit Kunden, um eine erfolgreiche Zustellung sicherzustellen und einen exzellenten Service zu bieten.'
        },
        {
          title: 'Bachelorarbeit & Softwareentwicklung mit JavaFX',
          company: 'Technische Hochschule Mittelhessen',
          location: 'Gießen, Deutschland',
          date: 'April 2025 - Dezember 2025',
          description: "Im Rahmen meiner Bachelorarbeit habe ich die Desktop-Anwendung 'ExamBuilder' mit JavaFX und nach dem MVC-Muster entworfen und entwickelt. Die Anwendung dient der Erstellung, Verwaltung und dem Export von Prüfungen. Zu den Kernfunktionen gehören die flexible Zusammenstellung von Fragen, das Generieren von Lösungsblättern und eine innovative Funktion zur KI-gestützten Reformulierung von Fragen, um die Prüfungsvielfalt zu erhöhen."
        },
        {
          title: 'Praktikum im CNC-Bereich',
          company: 'Schunk Group (STS)',
          location: 'Heuchelheim, Deutschland',
          date: 'Juli 2025 - August 2025',
          description: 'Intensives Praktikum in der Fertigung, in dem ich für die Programmierung und Bedienung von Siemens-CNC-Maschinen (Sinumerik) verantwortlich war. Zu meinen Aufgaben gehörten die selbstständige Fertigung von Präzisionsbauteilen sowie die kontinuierliche Überwachung und Optimierung der Fertigungsprozesse.'
        }
      ]
    },
    en: {
      title: 'Work Experience',
      timeline: [
        {
          title: 'Research & Development in Embedded Systems',
          company: 'THM - University of Applied Sciences',
          location: 'Giessen, Germany',
          date: 'October 2023 - Present',
          description: 'Contributing to a research project focused on developing a microcontroller-based remote laboratory. My responsibilities include implementing, testing, and optimizing embedded systems to ensure reliable and high-performance remote control of the lab environment.'
        },
        {
          title: 'Administrative Support & Language Services',
          company: 'Federal Office for Migration and Refugees (BAMF)',
          location: 'Giessen, Germany',
          date: '2023 - Present',
          description: 'As an interpreter, I facilitate hearings and provide precise written translations. I am also responsible for file creation and supporting general administrative processes to ensure smooth communication between the authorities and applicants.'
        },
        {
          title: 'Delivery Associate',
          company: 'Deutsche Post DHL',
          location: 'Germany',
          date: 'June 2022 - Present',
          description: 'As a delivery associate for Deutsche Post DHL, I am responsible for the reliable delivery of letters and parcels. This role demands a high level of self-organization and time management. A significant part of my work involves constant communication with customers to ensure successful deliveries and provide excellent service.'
        },
        {
          title: 'Bachelor Thesis & Software Development with JavaFX',
          company: 'THM - University of Applied Sciences',
          location: 'Giessen, Germany',
          date: 'April 2025 - December 2025',
          description: "As part of my bachelor thesis, I designed and developed the 'ExamBuilder' desktop application using JavaFX, following the MVC design pattern. The application enables the creation, management, and export of exams. Key features include flexible assembly of exam questions, automatic generation of correction sheets, and an innovative feature for AI-powered question rephrasing to enhance exam diversity."
        },
        {
          title: 'Internship in CNC Machining',
          company: 'Schunk Group (STS)',
          location: 'Heuchelheim, Germany',
          date: 'July 2025 - August 2025',
          description: 'Intensive internship in a manufacturing environment where I was responsible for programming and operating Siemens CNC machines (Sinumerik). My tasks included the independent production of precision components and the continuous monitoring and optimization of manufacturing processes.'
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