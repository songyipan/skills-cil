import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { FolderAnswers, SkillJson } from '../../types/index.js';

const createSkillFolderWithFile = async (folderName: string): Promise<void> => {
  try {
    const rootDir = process.cwd();
    const targetDir = path.join(rootDir, folderName);

    await fs.promises.mkdir(targetDir, { recursive: true });

    const skillFilePath = path.join(targetDir, 'SKILL.md');
    const jsonFilePath = path.join(targetDir, 'skills.json');

    const jsonDefault: SkillJson = {
      'skill-name': folderName,
      'skill-description': 'Write your skill description here.',
    };

    const defaultContent = `# ${folderName}\n\nWrite your skill documentation here.\n`;

    await fs.promises.writeFile(skillFilePath, defaultContent, {
      encoding: 'utf8',
    });
    await fs.promises.writeFile(
      jsonFilePath,
      JSON.stringify(jsonDefault, null, 2),
      { encoding: 'utf8' },
    );

    console.log(
      chalk.green(
        `Created folder "${folderName}" in project root and generated SKILL.md`,
      ),
    );
  } catch (error) {
    console.error('Failed to create SKILL.md:', error);
  }
};

const inputFolderName = async (): Promise<void> => {
  const answers = await inquirer.prompt<FolderAnswers>([
    {
      type: 'input',
      name: 'folderName',
      message: 'Please input the skill folder name to create:',
    },
  ]);

  if (!answers.folderName) {
    console.log(chalk.red('Folder name cannot be empty.'));
    process.exit(1);
  }

  await createSkillFolderWithFile(answers.folderName);
};

export const createOneSkill = (): Promise<void> => {
  return inputFolderName();
};
