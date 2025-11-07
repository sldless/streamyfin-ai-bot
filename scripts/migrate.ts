import { sql as rawSql } from '../src/lib/db/client';
import { runMigrations } from '../src/lib/db/migrate';

async function main() {
  console.log('Setting up database...\n');
  
  try {
    // Enable pgvecto.rs extension first
    console.log('Enabling pgvecto.rs (VectorChord) extension...');
    await rawSql`CREATE EXTENSION IF NOT EXISTS vectors`;
    console.log('✓ pgvecto.rs extension enabled\n');

    // Run Drizzle migrations
    await runMigrations();
    
    // Test pgvecto.rs
    const result = await rawSql`SELECT '[1,2,3]'::vector`;
    console.log('✓ pgvecto.rs is working\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();
