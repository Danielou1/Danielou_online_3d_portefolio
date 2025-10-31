// scripts/rename-functions.js
const fs = require('fs');
const path = require('path');

const functionsDir = path.join(process.cwd(), 'netlify', 'functions');

if (!fs.existsSync(functionsDir)) {
  console.warn('No netlify/functions directory found, skipping rename.');
  process.exit(0);
}

const files = fs.readdirSync(functionsDir);
for (const f of files) {
  if (f.includes('.server')) {
    const oldPath = path.join(functionsDir, f);
    const newName = f.replace(/\.server/g, '-server');
    const newPath = path.join(functionsDir, newName);
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${f} → ${newName}`);
  }
}
