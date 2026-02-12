import inquirer from 'inquirer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import FormData from 'form-data';
import chalk from 'chalk';
import {
  PushSkillParams,
  UploadParams,
  FileValidationResult,
  SkillInfo,
  CreateSkillParams,
  SkillAnswers,
} from '../../types/index.js';

export const runPushWorkflow = async (): Promise<void> => {
  try {
    const answers = await inquirer.prompt<SkillAnswers>([
      {
        type: 'input',
        name: 'skillName',
        message: 'Enter your skill name:',
      },
      {
        type: 'input',
        name: 'githubRepoUrl',
        message: 'The name of the repository on GitHub',
      },
      {
        type:'confirm',
        name:'confirm',
        default:false,
        message:"Are you sure that the name of the input warehouse is consistent with that of the remote one? Otherwise, it won't be accessible to other users."
      }
      
    ]);

    if (!answers.confirm) {
      console.log(chalk.red('Push skill canceled'));
      throw new Error('Push skill canceled');
    }
    
    handlePushSkill({ repoUrl: `${answers.githubRepoUrl}/${answers.skillName}`, skillName: answers.skillName });
  } catch (error) {
    console.error(error);
  }
};

// async function validateFile(filePath: string): Promise<FileValidationResult> {
//   const absolutePath = path.resolve(filePath);

//   if (!fs.existsSync(absolutePath)) {
//     throw new Error(`File not found: ${absolutePath}`);
//   }

//   const stat = fs.statSync(absolutePath);
//   if (stat.isDirectory()) {
//     throw new Error(`Path is a directory, not a file: ${absolutePath}`);
//   }

//   const MAX_SIZE = 3 * 1024 * 1024;
//   if (stat.size > MAX_SIZE) {
//     throw new Error(
//       `File size exceeds 3MB limit (current: ${(stat.size / 1024 / 1024).toFixed(2)}MB)`,
//     );
//   }

//   return {
//     absolutePath,
//     fileName: path.basename(absolutePath),
//     size: stat.size,
//   };
// }

async function getApiKey(): Promise<string> {
  const configPath = path.resolve('skills.register.json');
  const configContent = await fs.promises.readFile(configPath, 'utf8');
  const config = JSON.parse(configContent);

  if (!config.apiKey) {
    throw new Error('apiKey not found in skills.register.json');
  }

  return config.apiKey;
}

async function getSkillInfo(skillName: string): Promise<SkillInfo> {
  const skillDir = path.resolve(skillName);

  const skillsJsonPath = path.join(skillDir, 'skills.json');
  const skillMdPath = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillsJsonPath)) {
    throw new Error(`skills.json not found: ${skillsJsonPath}`);
  }
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found: ${skillMdPath}`);
  }

  const skillsJsonContent = await fs.promises.readFile(skillsJsonPath, 'utf8');
  const skillsJson = JSON.parse(skillsJsonContent);

  const mainContent = await fs.promises.readFile(skillMdPath, 'utf8');

  return {
    desc: (skillsJson as Record<string, unknown>)['skill-description'] as string || '',
    mainContent,
  };
}

// async function createUploadFormData(
//   absolutePath: string,
//   fileName: string,
//   apiKey: string,
// ): Promise<FormData> {
//   const formData = new FormData();
//   formData.append('file', fs.createReadStream(absolutePath));
//   formData.append('fileName', fileName.replace('.zip', ''));
//   formData.append('apiKey', apiKey);
//   return formData;
// }

// async function doUpload(formData: FormData): Promise<unknown> {
//   const response = await axios.post(
//     'http://localhost:3000/api/uploads',
//     formData,
//     {
//       headers: {
//         ...formData.getHeaders(),
//       },
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//     },
//   );
//   return response.data;
// }

// export const upload = async ({ filePath, skillName }: UploadParams): Promise<void> => {
//   try {
//     const { absolutePath, fileName, size } = await validateFile(filePath);
//     console.log(
//       `Uploading: ${fileName} (${(size / 1024 / 1024).toFixed(2)}MB) ...`,
//     );

//     const apiKey = await getApiKey();
//     const { desc, mainContent } = await getSkillInfo(skillName);
//     const formData = await createUploadFormData(absolutePath, fileName, apiKey);

//     const responseData = await doUpload(formData);

//     await createSkill({
//       name: fileName.replace('.zip', ''),
//       desc,
//       mainContent,
//       downloadUrl: (responseData as { url: string }).url,
//       apiKey,
//     });
//     console.log('Skill created successfully!!!');
//   } catch (e) {
//     if (axios.isAxiosError(e)) {
//       console.error('Server response:', e.response?.status, e.response?.data);
//     }
//     console.error('Upload failed:', (e as Error).message);
//     throw e;
//   }
// };

export const handlePushSkill = async ({ repoUrl, skillName }: PushSkillParams): Promise<void> => {
  try {
    const apiKey = await getApiKey();
    const { desc, mainContent } = await getSkillInfo(skillName);

    if (!repoUrl) {
      console.log(chalk.red('Repository is required'));
      throw new Error('Repository is required');
    }

    console.log(chalk.blue(`Pushing skill: ${skillName} ...`));

    await createSkill({
      name: skillName,
      desc,
      mainContent,
      downloadUrl: repoUrl,
      apiKey,
    });
    console.log(chalk.green('Skill created successfully!!!'));
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.error(chalk.red('Server response:'), e.response?.status, e.response?.data);
    }
    console.error(chalk.red('Upload failed:'), (e as Error).message);
    throw e;
  }
};

// function createZip(sourcePath: string, outPath: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     const output = fs.createWriteStream(outPath);
//     const archive = archiver('zip', {
//       zlib: { level: 9 },
//     });

//     output.on('close', () => {
//       resolve();
//     });

//     archive.on('error', (err: Error) => {
//       reject(err);
//     });

//     archive.pipe(output);

//     fs.promises
//       .stat(sourcePath)
//       .then((stat) => {
//         if (stat.isDirectory()) {
//           archive.directory(sourcePath, false);
//         } else {
//           archive.file(sourcePath, { name: path.basename(sourcePath) });
//         }
//         archive.finalize();
//       })
//       .catch((err) => reject(err));
//   });
// }

// async function findTargetPath(rootDir: string, fileName: string): Promise<string | null> {
//   const ignoreDirs = new Set(['node_modules', '.git', 'dist', '.cursor']);

//   const walk = async (currentDir: string): Promise<string | null> => {
//     const entries = await fs.promises.readdir(currentDir, {
//       withFileTypes: true,
//     });

//     for (const entry of entries) {
//       if (ignoreDirs.has(entry.name)) continue;

//       const fullPath = path.join(currentDir, entry.name);

//       if (entry.name === fileName) {
//         return fullPath;
//       }

//       if (entry.isDirectory()) {
//         const result = await walk(fullPath);
//         if (result) return result;
//       }
//     }

//     return null;
//   };

//   return walk(rootDir);
// }

// async function prepareArchivePath(rootDir: string, fileName: string): Promise<string> {
//   const distDir = path.join(rootDir, 'dist');
//   await fs.promises.mkdir(distDir, { recursive: true });

//   const archivePath = path.join(distDir, `${fileName}.zip`);

//   try {
//     await fs.promises.unlink(archivePath);
//   } catch {
//     // ignore
//   }

//   return archivePath;
// }

// async function selectFile({ fileName }: { fileName: string }): Promise<string> {
//   const rootDir = process.cwd();

//   const targetPath = await findTargetPath(rootDir, fileName);

//   if (!targetPath) {
//     throw new Error(`未在项目中找到名为 "${fileName}" 的文件或文件夹`);
//   }

//   const archivePath = await prepareArchivePath(rootDir, fileName);

//   try {
//     await createZip(targetPath, archivePath);
//   } catch (error) {
//     console.error('压缩失败:', error);
//     throw error;
//   }

//   console.log(`已生成压缩包: ${archivePath}`);
//   return archivePath;
// }

async function createSkill({ name, desc, mainContent, downloadUrl, apiKey }: CreateSkillParams): Promise<unknown> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('desc', desc);
  formData.append('mainContent', mainContent);
  formData.append('downloadUrl', downloadUrl);
  formData.append('apiKey', apiKey);

  const res = await axios.post('http://localhost:3000/api/skills', formData, {
    headers: {
      ...formData.getHeaders(),
    },
  });
  return res.data;
}
