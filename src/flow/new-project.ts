import chalk from 'chalk';
import { downloadTemplate } from 'giget';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { SkillConfig, ProjectAnswers } from '../../types/index.js';

async function createJsonFile(name: string, apiKey: string): Promise<void> {
  try {
    const json: SkillConfig = {
      'project-name': name,
      skills: [],
      apiKey,
    };

    const filePath = path.resolve(name, 'skills.register.json');

    await fs.promises.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to create skills.register.json:', error);
  }
}

export const downloadProject = async (name: string, apiKey: string): Promise<void> => {
  try {
    console.log(chalk.blue('creating project...'));
    await downloadTemplate('github:songyipan/skills', {
      dir: path.resolve(name),
      force: true,
    });

    await createJsonFile(name, apiKey);

    console.log(chalk.green('Successfully!!!'));
  } catch (e) {
    console.error(e);
  }
};

const inputProjectName = async (): Promise<void> => {
  const answers = await inquirer.prompt<ProjectAnswers>([
    {
      type: 'input',
      name: 'projectName',
      message: 'Please input your project name:',
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'Please input your api key:',
    },
  ]);

  if (!answers.projectName) {
    console.log(chalk.red('Please input your project name'));
    process.exit(1);
  }

  if (!answers.apiKey) {
    console.log(chalk.red('View the API key in the personal center'));
    process.exit(1);
  }

  await downloadProject(answers.projectName, answers.apiKey);
};

export const createNewProject = (): Promise<void> => {
  return inputProjectName();
};
