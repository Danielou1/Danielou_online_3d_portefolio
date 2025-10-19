import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Language, LanguageService } from './language.service';
import { SceneControlService } from './scene-control.service';

// L'objet retourné par le service
export interface BotResponse {
  text: string;
  navigationTarget?: string;
}

// Structure d'une règle
interface QARule {
  keywords: { de: string[], en: string[] };
  answer: { de: string, en: string };
  navigationTarget?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService implements OnDestroy {
  private currentLanguage: Language = 'de';
  private langSub: Subscription;

  private qaRules: QARule[] = [
    { // Salutations
      keywords: { de: ['hallo', 'guten tag', 'hey', 'bonjour', 'wie gehts', 'wie geht es'], en: ['hello', 'hi', 'hey', 'how are you'] },
      answer: {
        de: 'Hallo! Ich bin der virtuelle Assistent von Danielou. Mir geht es gut, danke! Fragen Sie mich alles über sein Profil.',
        en: 'Hello! I am Danielou\'s virtual assistant. I\'m doing well, thank you! Ask me anything about his profile.'
      }
    },
    { // Tell me about yourself
      keywords: { de: ['erzählen sie von sich', 'über sie', 'wer sind sie', 'person', 'persönlichkeit', 'beschreiben sie sich'], en: ['about you', 'who are you', 'your personality', 'describe yourself', 'tell me about yourself'] },
      answer: {
        de: 'Danielou ist ein zielstrebiger und neugieriger angehender Ingenieur-Informatiker von der THM. Er verbindet eine Leidenschaft für Technologie mit praktischer Erfahrung in der Softwareentwicklung und einem starken Fokus auf das Lösen komplexer Probleme.',
        en: 'Danielou is a determined and curious aspiring Applied Computer Science engineer from THM. He combines a passion for technology with practical software development experience and a strong focus on solving complex problems.'
      }
    },
    { // Strengths
      keywords: { de: ['stärken', 'vorteile', 'was zeichnet sie aus'], en: ['strengths', 'advantages', 'what sets you apart'] },
      answer: {
        de: 'Seine größten Stärken sind seine schnelle Auffassungsgabe, seine Problemlösungskompetenz und seine Fähigkeit, sich in neue Technologien einzuarbeiten. Er ist ein Teamplayer, der sowohl in der Embedded-Entwicklung mit C++ als auch in der Anwendungsentwicklung mit Java überzeugt.',
        en: 'His greatest strengths are his quick comprehension, problem-solving skills, and his ability to learn new technologies. He is a team player who excels in both embedded development with C++ and application development with Java.'
      }
    },
    { // Weaknesses
      keywords: { de: ['schwächen', 'nachteile'], en: ['weakness', 'weaknesses'] },
      answer: {
        de: 'Er ist manchmal ungeduldig, ein Problem zu lösen, was ihn aber dazu antreibt, die effizienteste und nicht nur die schnellste Lösung zu finden. Er lernt ständig, diese Energie in eine noch strukturiertere Analyse zu lenken.',
        en: 'He can be impatient to solve a problem, but this drives him to find the most efficient solution, not just the quickest one. He is constantly learning to channel this energy into even more structured analysis.'
      }
    },
    { // What are you looking for
      keywords: { de: ['was suchen sie', 'nächste schritte', 'karriereziele'], en: ['what are you looking for', 'next steps', 'career goals'] },
      answer: {
        de: 'Er sucht eine herausfordernde Position als Softwareentwickler, idealerweise im Bereich Embedded Systems oder hardwarenahe Programmierung, wo er seine Kenntnisse in C++ und Java vertiefen und an innovativen Projekten mitwirken kann.',
        en: 'He is looking for a challenging position as a software developer, ideally in embedded systems or hardware-related programming, where he can deepen his knowledge of C++ and Java and contribute to innovative projects.'
      }
    },
    { // Availability
      keywords: { de: ['verfügbarkeit', 'anfangen', 'starttermin', 'eintrittsdatum'], en: ['availability', 'start date', 'when can you start'] },
      answer: {
        de: 'Er schließt sein Studium Ende 2025 ab und steht ab dem 01.01.2026 für eine Vollzeitstelle zur Verfügung. Für Praktika oder Werkstudententätigkeiten ist er nach Absprache flexibel.',
        en: 'He will complete his studies at the end of 2025 and will be available for a full-time position from January 1st, 2026. He is flexible for internships or working student positions by arrangement.'
      }
    },
    { // General Experience
      keywords: { de: ['erfahrung', 'berufserfahrung', 'arbeit'], en: ['experience', 'work', 'background'] },
      answer: {
        de: 'Er hat praktische Erfahrungen in der Forschung an der THM, als Dolmetscher beim BAMF und im CNC-Bereich bei Schunk gesammelt. Soll ich Sie zum Abschnitt "Berufserfahrung" führen, um die Details zu sehen?',
        en: 'He has gained practical experience in research at THM, as an interpreter at BAMF, and in the CNC field at Schunk. Shall I guide you to the "Work Experience" section to see the details?'
      },
      navigationTarget: 'erfahrung'
    },
    { // Education
      keywords: { de: ['studium', 'akademisch', 'bildung', 'hochschule', 'ausbildung'], en: ['education', 'academic', 'university', 'degree'] },
      answer: {
        de: 'Er absolviert seinen Bachelor in Ingenieur-Informatik an der THM. Möchten Sie die Details seiner akademischen Laufbahn sehen?',
        en: 'He is completing his Bachelor in Applied Computer Science at THM. Would you like to see the details of his academic journey?'
      },
      navigationTarget: 'akademisch'
    },
    { // ExamBuilder Project
      keywords: { de: ['exambuilder', 'bachelorarbeit', 'abschlussprojekt'], en: ['exambuilder', 'bachelor thesis', 'final project'] },
      answer: {
        de: 'ExamBuilder ist seine Bachelorarbeit, eine Desktop-Anwendung in JavaFX zur Erstellung und Verwaltung von Prüfungen. Ein Kernfeature ist die KI-gestützte Neuformulierung von Fragen. Möchten Sie mehr über seine Projekte erfahren?',
        en: 'ExamBuilder is his bachelor thesis, a desktop application built with JavaFX for creating and managing exams. A core feature is the AI-powered rephrasing of questions. Would you like to learn more about his projects?'
      },
      navigationTarget: 'projekte'
    },
    { // General Projects
      keywords: { de: ['projekte', 'portfolio'], en: ['projects', 'portfolio'] },
      answer: {
        de: 'Er hat an mehreren Projekten gearbeitet, darunter seine Bachelorarbeit "ExamBuilder" und ein SmartLab-System. Soll ich Sie zur Projektübersicht bringen?',
        en: 'He has worked on several projects, including his bachelor thesis "ExamBuilder" and a SmartLab system. Shall I take you to the projects overview?'
      },
      navigationTarget: 'projekte'
    },
    { // Skills
      keywords: { de: ['kompetenzen', 'skills', 'fähigkeiten', 'technologien', 'c++', 'java', 'python'], en: ['skills', 'competencies', 'technologies', 'c++', 'java', 'python'] },
      answer: {
        de: 'Seine Kernkompetenzen sind C++, Java und Python, mit einem starken Fokus auf Embedded Systems. Er hat aber auch Erfahrung in der Web-Entwicklung und mit Datenbanken. Wollen Sie die detaillierte Liste sehen?',
        en: 'His core competencies are C++, Java, and Python, with a strong focus on Embedded Systems. He also has experience in web development and databases. Would you like to see the detailed list?'
      },
      navigationTarget: 'skills'
    },
    { // Languages
      keywords: { de: ['sprachen'], en: ['languages'] },
      answer: {
        de: 'Seine Muttersprache ist Französisch. Er spricht außerdem fließend Deutsch (C1) und gutes Englisch (B2). Soll ich Sie zur Sprachen-Sektion führen?',
        en: 'His native language is French. He also speaks fluent German (C1) and good English (B2). Shall I take you to the languages section?'
      },
      navigationTarget: 'sprachen'
    },
    { // Hobbies
      keywords: { de: ['hobbys', 'freizeit'], en: ['hobbies', 'free time'] },
      answer: {
        de: 'In seiner Freizeit liest er gerne Fachliteratur, spielt Fußball und arbeitet an eigenen kleinen Programmierprojekten, um neue Technologien zu lernen.',
        en: 'In his free time, he enjoys reading technical literature, playing soccer, and working on his own small programming projects to learn new technologies.'
      }
    },
    { // Contact
      keywords: { de: ['email', 'telefon', 'kontakt', 'anschrift'], en: ['email', 'phone', 'contact', 'address'] },
      answer: {
        de: 'Die Kontaktdaten von Danielou finden Sie im Abschnitt "Daten". Aus Datenschutzgründen gebe ich sie hier im Chat nicht direkt an.',
        en: 'You can find Danielou\'s contact details in the "Data" section. For privacy reasons, I will not provide them directly here in the chat.'
      },
      navigationTarget: 'daten'
    }
  ];

  private defaultAnswers: { de: string, en: string } = {
    de: 'Das ist eine gute Frage. Ich habe dazu keine vorprogrammierte Antwort. Für spezifische Anfragen kontaktieren Sie Daniel bitte direkt unter <a href="mailto:mounsandedaniel@gmail.com" class="text-blue-400 hover:underline">mounsandedaniel@gmail.com</a>.',
    en: 'That\'s a great question. I don\'t have a pre-programmed answer for that. For specific inquiries, please contact Daniel directly at <a href="mailto:mounsandedaniel@gmail.com" class="text-blue-400 hover:underline">mounsandedaniel@gmail.com</a>.'
  };

  constructor(
    private languageService: LanguageService, 
    private sceneControlService: SceneControlService,
    private router: Router
  ) {
    this.langSub = this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }

  public triggerNavigation(target: string): void {
    this.router.navigate([`/${target.toLowerCase()}`]);
    this.sceneControlService.requestZoom('screen');
  }

  public getAnswer(question: string): BotResponse {
    const lowerCaseQuestion = question.toLowerCase().trim();
    console.log(`--- New Question ---`);
    console.log(`Question: "${lowerCaseQuestion}"`);
    console.log(`Language: ${this.currentLanguage}`);

    for (const rule of this.qaRules) {
      const keywords = rule.keywords[this.currentLanguage] || rule.keywords.de;
      const match = keywords.find(kw => lowerCaseQuestion.includes(kw));
      if (match) {
        console.log(`SUCCESS: Matched keyword "${match}" for rule with answer: "${rule.answer[this.currentLanguage].substring(0, 20)}"...`);
        return {
          text: rule.answer[this.currentLanguage] || rule.answer.de,
          navigationTarget: rule.navigationTarget
        };
      } else {
        // Optional: log failures for deep debugging
        // console.log(`INFO: No match for keywords: [${keywords.join(', ')}]`);
      }
    }

    console.log(`FAILURE: No rule matched. Returning default answer.`);
    return { text: this.defaultAnswers[this.currentLanguage] || this.defaultAnswers.de };
  }
}