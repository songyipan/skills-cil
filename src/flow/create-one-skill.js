import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

const createSkillFolderWithFile = async (folderName) => {
  try {
    const rootDir = process.cwd();
    const targetDir = path.join(rootDir, folderName);

    // 创建文件夹（如果已存在则不会报错）
    await fs.promises.mkdir(targetDir, { recursive: true });

    const skillFilePath = path.join(targetDir, 'SKILL.md');
    const defaultContent = `# ${folderName}\n\nWrite your skill documentation here.\n`;

    await fs.promises.writeFile(skillFilePath, defaultContent, { encoding: 'utf8' });

    console.log(chalk.green(`Created folder "${folderName}" in project root and generated SKILL.md`));
  } catch (error) {
    console.error('Failed to create SKILL.md:', error);
  }
};

const inputFolderName = async () => {
  const answers = await inquirer.prompt([
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

export const createOneSkill = () => {
  return inputFolderName();
};
