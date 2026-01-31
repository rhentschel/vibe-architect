import pg from 'pg'
import { readFileSync } from 'fs'

const { Client } = pg

const client = new Client({
  host: '127.0.0.1',
  port: 54320,
  database: 'postgres',
  user: 'postgres',
  password: 'beM3jiMFOgZWhb8Grwmidr2nGgD3OvUW',
})

async function runMigration() {
  try {
    await client.connect()
    console.log('Verbunden mit PostgreSQL')

    const sql = readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8')

    await client.query(sql)
    console.log('Migration erfolgreich ausgeführt!')

  } catch (error) {
    console.error('Fehler:', error.message)
  } finally {
    await client.end()
  }
}

runMigration()
