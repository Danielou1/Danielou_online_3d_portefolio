import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import bodyParser from 'body-parser';
import { GoogleGenAI, Model } from '@google/genai';
import 'dotenv/config';
import cors from 'cors';

// The Express app is exported so that it can be used by serverless Functions.
export const expressApp = app();

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  expressApp.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
