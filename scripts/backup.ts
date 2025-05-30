import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

function copyFileSync(source: string, target: string) {
  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source: string, target: string, exclude: string[] = []) {
  let files = [];

  // Check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      
      // Skip excluded directories
      if (exclude.includes(file)) {
        return;
      }

      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder, exclude);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

function createBackup() {
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  try {
    // Create a new directory for this backup
    fs.mkdirSync(backupPath, { recursive: true });

    // Define directories to exclude
    const excludeDirs = [
      'node_modules',
      '.git',
      'backups',
      '.next',
      'dist',
      'build'
    ];

    // Copy files
    const sourceDir = process.cwd();
    copyFolderRecursiveSync(sourceDir, path.dirname(backupPath), excludeDirs);

    console.log(`Backup created successfully at: ${backupPath}`);
    
    // Keep only the last 5 backups
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-'))
      .sort()
      .reverse();

    if (backups.length > 5) {
      backups.slice(5).forEach(backup => {
        const backupDir = path.join(BACKUP_DIR, backup);
        fs.rmSync(backupDir, { recursive: true, force: true });
        console.log(`Removed old backup: ${backup}`);
      });
    }

    return backupPath;
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw error;
  }
}

function restoreBackup(backupPath: string) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found at: ${backupPath}`);
  }

  try {
    const excludeDirs = [
      'node_modules',
      '.git',
      'backups',
      '.next',
      'dist',
      'build'
    ];

    const sourceDir = backupPath;
    const targetDir = process.cwd();

    copyFolderRecursiveSync(sourceDir, path.dirname(targetDir), excludeDirs);
    console.log(`Successfully restored from backup: ${backupPath}`);
  } catch (error) {
    console.error('Failed to restore backup:', error);
    throw error;
  }
}

// If script is run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const backupPath = args[1];

  if (command === 'create') {
    createBackup();
  } else if (command === 'restore' && backupPath) {
    restoreBackup(backupPath);
  } else {
    console.log('Usage:');
    console.log('  Create backup: npm run backup create');
    console.log('  Restore backup: npm run backup restore <backup-path>');
  }
}

export { createBackup, restoreBackup }; 