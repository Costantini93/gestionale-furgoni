#!/usr/bin/env node
/**
 * Script per aggiungere colonna first_login alla tabella users su Turso
 */

require('dotenv').config();
const { createClient } = require('@libsql/client');

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ ERRORE: Configura TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nel .env');
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fix() {
  try {
    console.log('🔧 Fix colonna first_login...\n');
    
    // Verifica se colonna esiste già
    const tableInfo = await client.execute(`PRAGMA table_info(users)`);
    const hasFirstLogin = tableInfo.rows.some(col => col.name === 'first_login');
    
    if (hasFirstLogin) {
      console.log('✅ Colonna first_login già presente!');
      return;
    }
    
    console.log('📋 Aggiunta colonna first_login...');
    await client.execute(`
      ALTER TABLE users ADD COLUMN first_login INTEGER DEFAULT 1
    `);
    
    console.log('✅ Colonna first_login aggiunta con successo!\n');
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    process.exit(1);
  }
}

fix();
