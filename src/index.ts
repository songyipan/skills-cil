import { Command } from "commander";
import { createNewProject } from "./flow/new-project.js";
import { runPushWorkflow } from "./flow/push-work-flow.js";
import { createOneSkill } from "./flow/create-one-skill.js";
import { runUseSkillsWorkflow } from "./flow/use-skills.js";

const program = new Command();

program
  .version("1.0.0")
  .option("--push", "推送github地址")
  .option("--new", "生成新项目")
  .option("--create", "下载项目")
  .option("--use", "使用技能")
  .option("--add <name>", "添加技能")
  .parse(process.argv);

const options = program.opts();

if (options.push) {
  console.log("Pushing to remote...");
  runPushWorkflow();
}

if (options.new) {
  createNewProject();
}

if (options.create) {
  createOneSkill();
}

if (options.add) {
  runUseSkillsWorkflow(options.add);
}
