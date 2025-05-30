import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MODELS_DIR = path.join(process.cwd(), 'public', 'models');
const BRAIN_MODEL_URL = 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/brain/model.gltf';

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {
        reject(err);
      });
    });
  });
}

async function optimizeModel(inputPath: string, outputPath: string): Promise<void> {
  try {
    await execAsync(`gltf-pipeline -i ${inputPath} -o ${outputPath} --draco.compressionLevel=7`);
    console.log('Model optimized successfully');
  } catch (error) {
    console.error('Error optimizing model:', error);
    throw error;
  }
}

async function main() {
  try {
    // Create models directory if it doesn't exist
    if (!fs.existsSync(MODELS_DIR)) {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
    }

    const brainModelPath = path.join(MODELS_DIR, 'brain.gltf');
    const optimizedBrainModelPath = path.join(MODELS_DIR, 'brain.glb');

    // Download brain model
    console.log('Downloading brain model...');
    await downloadFile(BRAIN_MODEL_URL, brainModelPath);

    // Install gltf-pipeline if not installed
    console.log('Installing gltf-pipeline...');
    await execAsync('npm install -g gltf-pipeline');

    // Optimize model
    console.log('Optimizing brain model...');
    await optimizeModel(brainModelPath, optimizedBrainModelPath);

    // Clean up original file
    fs.unlinkSync(brainModelPath);

    console.log('Brain model downloaded and optimized successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 