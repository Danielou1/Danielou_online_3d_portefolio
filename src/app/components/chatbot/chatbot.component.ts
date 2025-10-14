import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, BotResponse } from '../../chatbot.service';

// Interface pour un message dans le chat
interface Message {
  sender: 'user' | 'bot';
  text: string;
  navigationTarget?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  isOpen = false;
  messages: Message[] = [];
  userInput = '';

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Premier message du bot pour accueillir l'utilisateur
    this.messages.push({
      sender: 'bot',
      text: 'Hallo! Ich bin der virtuelle Avatar von Danielou. Stellen Sie mir gerne Ihre Fragen.'
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (this.userInput.trim() === '') {
      return;
    }

    // Ajoute le message de l'utilisateur
    this.messages.push({ sender: 'user', text: this.userInput });

    // Récupère la réponse complexe du bot
    const botResponse: BotResponse = this.chatbotService.getAnswer(this.userInput);
    
    // Ajoute la réponse du bot
    this.messages.push({ 
      sender: 'bot', 
      text: botResponse.text, 
      navigationTarget: botResponse.navigationTarget 
    });

    // Vide le champ de saisie
    this.userInput = '';
  }

  // Nouvelle méthode pour gérer le clic sur un message
  handleNavigationClick(target: string | undefined): void {
    if (target) {
      this.chatbotService.triggerNavigation(target);
      // Optionnel : fermer le chat après le clic
      this.isOpen = false;
    }
  }
}
