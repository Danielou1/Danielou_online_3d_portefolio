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
      keywords: { de: ['hallo', 'guten tag', 'hey', 'bonjour'], en: ['hello', 'hi', 'hey'] },
      answer: {
        de: 'Hallo! Ich bin der virtuelle Avatar von Danielou. Fragen Sie mich alles über sein Profil.',
        en: 'Hello! I am Danielou\'s virtual avatar. Ask me anything about his profile.'
      }
    },
    { // Disponibilité
      keywords: { de: ['verfügbarkeit', 'anfangen', 'starttermin', 'eintrittsdatum'], en: ['availability', 'start date', 'when can you start'] },
      answer: {
        de: 'Ich schließe mein Studium in Kürze ab und bin daher flexibel. Für eine Vollzeitstelle stehe ich ab dem 01.01.2026 zur Verfügung.',
        en: 'I am finishing my studies soon and am therefore flexible. I will be available for a full-time position from January 1st, 2026.'
      }
    },
    { // Pourquoi vous
      keywords: { de: ['warum sie', 'einstellen', 'nicht andere', 'vorteile', 'sollen wir sie', 'unterscheidet sie'], en: ['why you', 'hire', 'advantages', 'what sets you apart'] },
      answer: {
        de: 'Ich glaube, meine Stärke liegt in der Kombination aus soliden technischen Fähigkeiten in C++ und Java, meiner praktischen Industrieerfahrung und meiner großen Lernbereitschaft. Ich entwickle nicht nur Code, sondern robuste und durchdachte Lösungen für komplexe Probleme.',
        en: 'I believe my strength lies in the combination of solid technical skills in C++ and Java, my practical industry experience, and my strong willingness to learn. I don\'t just write code; I develop robust and well-thought-out solutions for complex problems.'
      }
    },
    { // Faiblesses
      keywords: { de: ['schwächen', 'nachteile'], en: ['weakness', 'weaknesses'] },
      answer: {
        de: 'Meine größte Schwäche ist wahrscheinlich meine Ungeduld, wenn es darum geht, Probleme zu lösen. Ich habe jedoch gelernt, dies in eine Stärke umzuwandeln, indem ich diese Energie in eine gründliche und strukturierte Analyse lenke, um die beste Lösung zu finden, nicht nur die schnellste.',
        en: 'My biggest weakness is probably my impatience when it comes to solving problems. However, I\'ve learned to turn this into a strength by channeling that energy into thorough and structured analysis to find the best solution, not just the fastest one.'
      }
    },
    { // Personnalité
      keywords: { de: ['mensch', 'person', 'persönlichkeit', 'über ihre person', 'über dich erzählen', 'beschreiben sie sich'], en: ['person', 'personality', 'describe yourself', 'tell me about yourself'] },
      answer: {
        de: 'Als Mensch bin ich neugierig, aufgeschlossen und zielstrebig. Ich gehe gerne auf Leute zu und glaube, dass man durch Teamarbeit und offene Kommunikation die besten Ergebnisse erzielt. In meiner Freizeit lerne ich ständig dazu, sei es durch Lesen oder kleine Programmierprojekte.',
        en: 'As a person, I am curious, open-minded, and determined. I enjoy approaching people and believe that teamwork and open communication yield the best results. In my free time, I am constantly learning, whether through reading or small programming projects.'
      }
    },
    { // Expérience actuelle
      keywords: { de: ['wo arbeiten sie', 'arbeitgeber', 'jetzige position'], en: ['where do you work', 'current employer'] },
      answer: {
        de: 'Derzeit unterstütze ich die Forschung und Entwicklung an der Technischen Hochschule Mittelhessen und arbeite als Dolmetscher für das BAMF. Im Sommer 2025 ist zudem ein Praktikum bei der Schunk Group geplant. Möchten Sie mehr über meine Berufserfahrung erfahren?',
        en: 'I currently support research and development at the THM and work as an interpreter for the BAMF. An internship at the Schunk Group is also planned for summer 2025. Would you like to know more about my work experience?'
      },
      navigationTarget: 'erfahrung'
    },
    { // Expérience générale
      keywords: { de: ['erfahrung', 'berufserfahrung', 'arbeit', 'werdegang', 'karriere', 'laufbahn'], en: ['experience', 'experiences', 'work', 'career', 'background'] },
      answer: {
        de: 'Ich habe praktische Erfahrungen in der Softwareentwicklung bei Continental und der THM sowie als Dolmetscher gesammelt. Diese diversen Rollen haben meine technischen Fähigkeiten und meine Kommunikationsstärke verbessert. Soll ich Sie zu diesem Abschnitt führen?',
        en: 'I have gained practical experience in software development at Continental and THM, as well as an interpreter. These diverse roles have improved my technical abilities and communication skills. Shall I guide you to that section?'
      },
      navigationTarget: 'erfahrung'
    },
    { // Formation
      keywords: { de: ['studium', 'akademisch', 'bildung', 'hochschule', 'schulabschluss', 'ausbildung', 'qualifikationen'], en: ['education', 'academic', 'university', 'college', 'degree', 'qualifications'] },
      answer: {
        de: 'Ich absolviere derzeit meinen Bachelor in Ingenieur-Informatik an der Technischen Hochschule Mittelhessen. Mein Abitur mit Schwerpunkt Naturwissenschaften habe ich in Kamerun gemacht. Soll ich Ihnen meinen akademischen Werdegang zeigen?',
        en: 'I am currently completing my Bachelor\'s in Engineering & Computer Science at the THM - University of Applied Sciences. I completed my high school diploma in Cameroon with a focus on science. Shall I show you my academic journey?'
      },
      navigationTarget: 'akademisch'
    },
    { // Projets
      keywords: { de: ['projekte', 'portfolio', 'eigene arbeiten'], en: ['projects', 'portfolio', 'personal projects'] },
      answer: {
        de: 'Ich habe an mehreren spannenden Projekten gearbeitet, darunter ein SmartLab System mit STM32 und MQTT und ein ExamBuilder in Java mit Gemini API. Möchten Sie die Projektdetails sehen?',
        en: 'I have worked on several exciting projects, including a SmartLab System with STM32 and MQTT, and an ExamBuilder in Java with Gemini API integration. Would you like to see the project details?'
      },
      navigationTarget: 'projekte'
    },
    { // Compétences techniques
      keywords: { de: ['kompetenzen', 'skills', 'fähigkeiten', 'technologien', 'c++', 'java', 'python', 'kenntnisse', 'wissen'], en: ['skills', 'competencies', 'technologies', 'c++', 'java', 'python', 'knowledge'] },
      answer: {
        de: 'Meine Kernkompetenzen liegen in C++ und Java. Ich habe auch Erfahrung mit Python, SQL, Web-Technologien und Embedded-Protokollen wie I2C und SPI. Wollen Sie eine detaillierte Übersicht?',
        en: 'My core competencies are in C++ and Java. I also have experience with Python, SQL, web technologies, and embedded protocols like I2C and SPI. Would you like a detailed overview?'
      },
      navigationTarget: 'skills'
    },
    { // Soft Skills
      keywords: { de: ['soft skills', 'stärken'], en: ['soft skills', 'strengths'] },
      answer: {
        de: 'Ich sehe meine Stärken in meiner ausgeprägten Lernbereitschaft, meiner Teamfähigkeit und meinem kritischen Denken. Ich übernehme gerne Verantwortung und kommuniziere effektiv.',
        en: 'I see my strengths in my strong willingness to learn, my ability to work in a team, and my critical thinking. I like to take responsibility and communicate effectively.'
      }
    },
    { // Permis de conduire
        keywords: { de: ['führerschein', 'mobil', 'auto'], en: ['driving license', 'driver\'s license', 'mobile', 'car'] },
        answer: {
            de: 'Ja, ich besitze einen Führerschein der Klasse B. Das macht mich mobil und flexibel für berufliche Termine und Reisen.',
            en: 'Yes, I have a Class B driver\'s license. This makes me mobile and flexible for work-related appointments and travel.'
        }
    },
    { // Langues
      keywords: { de: ['sprachen'], en: ['languages'] },
      answer: {
        de: 'Meine Muttersprache ist Französisch. Außerdem spreche ich fließend Deutsch (C1) und Englisch (B2).',
        en: 'My native language is French. I also speak fluent German (C1) and English (B2).'
      },
      navigationTarget: 'sprachen'
    },
    { // Hobbys
      keywords: { de: ['hobbys', 'freizeit'], en: ['hobbies', 'free time'] },
      answer: {
        de: 'In meiner Freizeit lese ich gerne, spiele Fußball und natürlich programmiere ich auch an eigenen kleinen Projekten.',
        en: 'In my free time, I enjoy reading, playing soccer, and of course, programming my own small projects.'
      }
    },
    { // Enfants
        keywords: { de: ['kinder', 'familie'], en: ['children', 'family'] },
        answer: {
            de: 'Ja, ich habe eine wundervolle kleine Tochter, die meine Tage erhellt.',
            en: 'Yes, I have a wonderful little girl who brightens up my days.'
        }
    },
    { // Contact (Polite refusal)
      keywords: { de: ['email', 'telefon', 'kontakt'], en: ['email', 'phone', 'contact'] },
      answer: {
        de: 'Meine Kontaktdaten finden Sie im entsprechenden Bereich des Portfolios. Aus Datenschutzgründen gebe ich sie hier im Chat nicht direkt weiter.',
        en: 'You can find my contact details in the dedicated section of the portfolio. For privacy reasons, I do not provide them directly here in the chat.'
      }
    }
  ];

  private defaultAnswers: { de: string, en: string } = {
    de: 'Das ist eine interessante Frage. Am besten besprechen Sie das direkt mit mir. In der Zwischenzeit, kann ich Ihnen bei einem anderen Thema helfen?',
    en: 'That is an interesting question. It would be best to discuss that with me directly. In the meantime, can I help you with another topic?'
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