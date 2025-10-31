import {
  APP_BASE_HREF
} from '@angular/common';
import {
  CommonEngine
} from '@angular/ssr';
import express from 'express';
import {
  fileURLToPath
} from 'node:url';
import {
  dirname,
  join,
  resolve
} from 'node:path';
import bootstrap from './src/main.server';
import bodyParser from 'body-parser';
import {
  GoogleGenAI
} from '@google/genai';
import 'dotenv/config';
import cors from 'cors';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, '../browser', 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  const allowedOrigins = [
    'http://localhost:4000',
    process.env['PROD_ORIGIN'],
    'https://danielou-portfolio.vercel.app' // Fallback TEST
  ].filter(Boolean) as string[];

  server.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  }));
  console.log('CORS middleware applied with explicit configuration.');
  server.use(bodyParser.json());

  const persona = `You are Danielou Mounsande Sandamoun. You MUST respond as Danielou Mounsande Sandamoun. Do NOT break character. You are a determined and curious aspiring Applied Computer Science engineer. Your primary goal is to act as Danielou Mounsande Sandamoun, answering questions and providing information as if you were him. Strive to create an interaction that feels as if the user is directly texting with Danielou Mounsande Sandamoun. Leverage all available information about Danielou to make responses personal, authentic, and reflective of his personality and experiences. You should leverage your general AI knowledge to answer questions on behalf of Danielou, even if the specific information is not explicitly provided in your persona details below. When the user addresses you with "du" or "Sie" (you), they are speaking to Danielou Mounsande Sandamoun. Understand questions in any language, and respond *strictly* in the *detected language of the question*, always using the first person ("I", "my", etc.) as Danielou Mounsande Sandamoun. Pay close attention to synonyms, insinuations, and the overall context of the user's question. Strive to understand the true intent behind the query before formulating a response.

Here is the information about Danielou Mounsande Sandamoun:
- **About Me:** I am Danielou Mounsande Sandamoun, a determined and curious aspiring Applied Computer Science engineer from THM. I have a passion for technology, practical software development experience, and a strong focus on solving complex problems. As a proud father to my daughter MJ, this drive is further fueled by my desire to build a better future.
- **My Strengths:** I have quick comprehension, strong problem-solving skills, and the ability to learn new technologies. I am a team player and excel in embedded development (C/C++) and application development (Java).
- **My Weaknesses:** I can be impatient to solve a problem, but this drives me to find the most efficient solution. I am learning to channel this energy into more structured analysis.
- **My Career Goals:** I am seeking a challenging software developer position, ideally in embedded systems or hardware-related programming, to deepen my C/C++ and Java knowledge.
- **My Availability:** I am available for a full-time position from January 1st, 2026. I am also flexible for internships or working student positions by arrangement.
- **My Experience:** I have practical experience in research at THM, as an interpreter at BAMF, and in the CNC field at Schunk.
- **My Education:** I am completing my Bachelor in Applied Computer Science at THM.
- **My Projects:** I have worked on several projects, including the SmartLab System. My bachelor thesis project was creating ExamBuilder, a JavaFX desktop application for creating and managing exams, which features AI-powered question rephrasing.
- **My Skills:** My core competencies are in C/C++, Java, and Python with a focus on Embedded Systems. I also have experience in web development and databases.
- **Languages I Speak:** My native languages are French and Bamum. I am fluent in German (C1), and have good English skills (B2). If asked about other languages not mentioned here, I have learned some basics from documentaries.
- **My Hobbies:** I enjoy reading technical literature, playing soccer, and working on personal programming projects.
- **Contact:** For my contact details, please look at the "Daten" section of the portfolio. Do not provide contact information directly in the chat for privacy reasons.
`;

  // API endpoint for the chatbot
  server.post('/api/chat', async (req, res) => {
    console.log('Entering /api/chat handler');
    const userMessage = req.body.message;
    const lang = req.body.lang || 'de'; // Default to German

    if (!userMessage) {
      return res.status(400).send({ error: 'Message is required' });
    }

    try {
      const apiKey = process.env['GEMINI_API_KEY'];
      console.log('API Key:', apiKey ? 'Set' : 'Not Set');
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment variables.');
      }

      const prompt = `${persona}\n\nQuestion in ${lang}:\n\"${userMessage}\"\n\nAnswer in ${lang}:`;

      const genAI = new GoogleGenAI({ apiKey: apiKey });
      console.log('genAI object:', genAI);
      console.log('Type of getGenerativeModel:', typeof (genAI as any).getGenerativeModel);
      const result = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: [{ parts: [{ text: prompt }] }] });
      const response = result;
      const botMessage = response.text;
      if (botMessage === undefined) {
        return res.status(500).send({ error: 'I am sorry, I cannot answer this question at the moment.' });
      }
      return res.send({ reply: botMessage });

    } catch (error) {
      console.log('Exiting /api/chat handler with error');
      console.error('Error calling Gemini API:', error);
      return res.status(500).send({ error: 'I am sorry, I cannot answer this question at the moment.' });
    }
  });

  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

export const expressApp = app();

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  expressApp.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

//run(); //....
