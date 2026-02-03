import inquirer from 'inquirer';

export const runPushWorkflow = async () => {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'token',
        message: 'Enter your SkillsHub token:',
      },
      // skill name
      {
        type: 'input',
        name: 'skillName',
        message: 'Enter your skill name:',
      },
      // skill description
      {
        type: 'input',
        name: 'skillDescription',
        message: 'Enter your skill description:',
      },
      {
        type: 'input',
        name: 'skill url',
        message: 'Enter your skill url:',
      },
    ]);
    console.log(answers);
  } catch (error) {
    console.error(error);
  }
};
