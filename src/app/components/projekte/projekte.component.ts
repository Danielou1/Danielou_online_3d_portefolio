import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from '../../language.service';

@Component({
  selector: 'app-projekte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projekte.component.html',
  styleUrls: ['./projekte.component.css']
})
export class ProjekteComponent implements OnInit, OnDestroy {

  currentLanguage: Language = 'de';
  private langSub!: Subscription;

  projectsData = {
    de: {
      title: 'Ausgewählte Projekte',
      projects: [
        {
          name: 'Interaktives 3D-Portfolio',
          description: 'Entwicklung dieses interaktiven 3D-Portfolios als virtuelle Bahnhofsszene mit Angular und Three.js. Integration von synchronisierten HTML-Panels für dynamische Inhalte und interaktive Elemente.',
          tags: ['Angular', 'Three.js', 'TypeScript', 'WebGL', 'SSR', 'UI/UX']
        },
        {
          name: 'Echtzeit-Stoppuhr mit STM32F4',
          description: 'Implementierung einer präzisen digitalen Stoppuhr auf einem STM32F4 Mikrocontroller. Das Projekt umfasste die Programmierung von Timern, Interrupts und die Ansteuerung eines LCD-Displays zur Anzeige der Zeit. Fokus auf Echtzeitverarbeitung und Hardware-Interaktion.',
          tags: ['STM32F4', 'Embedded C', 'Mikrocontroller', 'Timer', 'Interrupts', 'LCD']
        },
        {
          name: 'Autonome Wetterstation mit STM32F4',
          description: 'Entwicklung einer autonomen Wetterstation basierend auf einem STM32F4 Mikrocontroller. Integration verschiedener Sensoren (Temperatur, Luftfeuchtigkeit, Druck) und Datenübertragung über UART/I2C. Visualisierung der Wetterdaten auf einem Display oder über serielle Schnittstelle.',
          tags: ['STM32F4', 'Embedded C', 'Sensoren', 'UART', 'I2C', 'Wetterdaten']
        },
        {
          name: 'Terminal-Snake in C',
          description: 'Implementierung des klassischen Snake-Spiels als Konsolenanwendung in C. Das Projekt demonstriert Kenntnisse in der Konsolenprogrammierung, Datenstrukturen und Algorithmen für die Spielmechanik und Kollisionserkennung.',
          tags: ['C-Programmierung', 'Konsolenanwendung', 'Algorithmen', 'Spieleentwicklung']
        },
        {
          name: 'Web-Ping-Pong mit JavaScript & Docker',
          description: 'Entwicklung eines interaktiven Ping-Pong-Spiels für den Webbrowser mit JavaScript. Das Projekt wurde in Docker-Containern verpackt, um eine einfache Bereitstellung und konsistente Ausführung zu gewährleisten. Fokus auf Frontend-Entwicklung und Containerisierung.',
          tags: ['JavaScript', 'HTML5 Canvas', 'Webentwicklung', 'Docker', 'Containerisierung']
        },
        {
          name: 'ExamBuilder',
          description: 'Desktop-Anwendung zur Erstellung und Verwaltung von Prüfungen (DOCX, JSON) mit KI-gestützter Frageumformulierung über die Gemini API.',
          tags: ['JavaFX', 'Maven', 'Apache POI', 'Gemini API', 'Unit Testing']
        },
        {
          name: 'Smart Lab System',
          description: 'Entwicklung eines intelligenten Laborsystems mit STM32 und BME280-Sensorik. Implementierung der Embedded-Software in C/C++ und einer JavaFX-GUI zur Echtzeitvisualisierung via MQTT.',
          tags: ['C/C++', 'STM32', 'JavaFX', 'MQTT', 'Embedded']
        },
        {
          name: 'AVR Microcontroller Kurs',
          description: 'Praxisnaher Kurs in C/C++ auf AVR-Mikrocontrollern, der GPIO, Timer, Interrupts, I2C, UART, PWM und die Ansteuerung von LCDs und Sensoren abdeckt.',
          tags: ['C/C++', 'AVR', 'Embedded', 'I2C', 'UART']
        }
      ]
    },
    en: {
      title: 'Featured Projects',
      projects: [
        {
          name: 'Interactive 3D Portfolio',
          description: 'Development of this interactive 3D portfolio as a virtual train station scene using Angular and Three.js. Integration of synchronized HTML panels for dynamic content and interactive elements.',
          tags: ['Angular', 'Three.js', 'TypeScript', 'WebGL', 'SSR', 'UI/UX']
        },
        {
          name: 'Real-time Stopwatch with STM32F4',
          description: 'Implementation of a precise digital stopwatch on an STM32F4 microcontroller. The project involved programming timers, interrupts, and controlling an LCD display for time visualization. Focus on real-time processing and hardware interaction.',
          tags: ['STM32F4', 'Embedded C', 'Microcontroller', 'Timers', 'Interrupts', 'LCD']
        },
        {
          name: 'Autonomous Weather Station with STM32F4',
          description: 'Development of an autonomous weather station based on an STM32F4 microcontroller. Integration of various sensors (temperature, humidity, pressure) and data transmission via UART/I2C. Visualization of weather data on a display or via serial interface.',
          tags: ['STM32F4', 'Embedded C', 'Sensors', 'UART', 'I2C', 'Weather Data']
        },
        {
          name: 'Terminal Snake Game in C',
          description: 'Implementation of the classic Snake game as a console application in C. This project demonstrates knowledge of console programming, data structures, and algorithms for game mechanics and collision detection.',
          tags: ['C Programming', 'Console Application', 'Algorithms', 'Game Development']
        },
        {
          name: 'Web Ping-Pong Game with JavaScript & Docker',
          description: 'Development of an interactive Ping-Pong game for the web browser using JavaScript. The project was containerized with Docker for easy deployment and consistent execution. Focus on frontend development and containerization.',
          tags: ['JavaScript', 'HTML5 Canvas', 'Web Development', 'Docker', 'Containerization']
        },
        {
          name: 'ExamBuilder',
          description: 'Desktop application for creating and managing exams (DOCX, JSON) with AI-powered question rephrasing via the Gemini API.',
          tags: ['JavaFX', 'Maven', 'Apache POI', 'Gemini API', 'Unit Testing']
        },
        {
          name: 'Smart Lab System',
          description: 'Developed a smart laboratory system using STM32 and BME280 sensors. Implemented the embedded software in C/C++ and a JavaFX GUI for real-time visualization via MQTT.',
          tags: ['C/C++', 'STM32', 'JavaFX', 'MQTT', 'Embedded']
        },
        {
          name: 'AVR Microcontroller Course',
          description: 'Hands-on course in C/C++ on AVR microcontrollers, covering GPIO, timers, interrupts, I2C, UART, PWM, and interfacing with LCDs and sensors.',
          tags: ['C/C++', 'AVR', 'Embedded', 'I2C', 'UART']
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