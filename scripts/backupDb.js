#!/usr/bin/env node
/**
 * Script di Backup Database SQLite
 * 
 * Uso:
 *   node scripts/backupDb.js
 * 
 * Crea un backup timestampato del database nella cartella backups/
 */

const fs = require('fs');
const path = require('path');

// Determina path database (stesso logic di config/database.js)
const renderDataPath = '/opt/render/project/src/data';
let dbDir;

if (fs.existsSync(renderDataPath)) {
  dbDir = renderDataPath;
} else {
  dbDir = path.join(__dirname, '..');
}

const dbPath = path.join(dbDir, 'database.db');
const backupDir = path.join(__dirname, '..', 'backups');

// Crea directory backup se non esiste
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('✅ Creata directory backups/');
}

// Verifica che database esista
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database non trovato:', dbPath);
  process.exit(1);
}

// Crea nome file backup con timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const timeHHMM = new Date().toTimeString().substring(0, 5).replace(':', '');
const backupFilename = `database-backup-${timestamp}-${timeHHMM}.db`;
const backupPath = path.join(backupDir, backupFilename);

try {
  // Copia database
  fs.copyFileSync(dbPath, backupPath);
  
  const stats = fs.statSync(backupPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  
  console.log('✅ Backup completato!');
  console.log('📂 File:', backupFilename);
  console.log('📊 Dimensione:', sizeKB, 'KB');
  console.log('📁 Path completo:', backupPath);
  
  // Elenca tutti i backup esistenti
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('database-backup-'))
    .sort()
    .reverse();
  
  console.log('\n📋 Backup disponibili:');
  backups.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const fileStats = fs.statSync(filePath);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);
    console.log(`  ${index + 1}. ${file} (${fileSizeKB} KB)`);
  });
  
  // Suggerimento cleanup vecchi backup (opzionale)
  if (backups.length > 10) {
    console.log('\n⚠️  Hai più di 10 backup. Considera di eliminare i più vecchi:');
    console.log('   cd backups && rm database-backup-2024-*');
  }
  
} catch (err) {
  console.error('❌ Errore durante backup:', err.message);
  process.exit(1);
}
