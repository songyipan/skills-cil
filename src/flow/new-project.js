import chalk from 'chalk';
import { downloadTemplate } from 'giget';
import inquirer from 'inquirer';
export const downloadProject = async (name) => {
  try {
    console.log(chalk.blue('creating project...'));
    await downloadTemplate('github:antfu/skills', {
      dir: `./${name}`,
      force: true,
    });
    console.log(chalk.green('Successfully!!!'));
  } catch (e) {
    console.error(e);
  }
};

const inputProjectName = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Please input your project name:',
    },
  ]);

  if (!answers.projectName) {
    console.log(chalk.red('Please input your project name'));
    process.exit(1);
  }

  await downloadProject(answers.projectName);
};

export const createNewProject = () => {
  return inputProjectName();
};
