import { createBackup } from './backup';

async function preBuild() {
  try {
    console.log('Creating backup before build...');
    const backupPath = createBackup();
    console.log(`Backup created at: ${backupPath}`);
    console.log('Proceeding with build...');
  } catch (error) {
    console.error('Failed to create backup:', error);
    process.exit(1);
  }
}

preBuild(); 