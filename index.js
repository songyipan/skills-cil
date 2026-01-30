#!/usr/bin/env node
import degit from "degit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { createInterface } from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let skill = process.argv[2];

// 支持 skills-cil add <skill-name> 格式
if (skill === "add") {
  skill = process.argv[3];
}

if (!skill) {
  console.log("Usage: my-skill add <skill-name>");
  process.exit(1);
}

// 获取用户选择的模型
const models = ["claude-code", "codex"];
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const promptModel = () => {
  return new Promise((resolve) => {
    console.log("\nSelect a model:");
    models.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
    rl.question("\nEnter number (1-2): ", (answer) => {
      const idx = parseInt(answer) - 1;
      if (idx >= 0 && idx < models.length) {
        rl.close();
        resolve(models[idx]);
      } else {
        console.log("Invalid choice, please try again.");
        promptModel().then(resolve);
      }
    });
  });
};

// 选择模型并获取 skill 名称
const model = await promptModel();

// 你的 registry.json URL
const REGISTRY_URL = "https://raw.githubusercontent.com/songyipan/skills/main/registry.json";

const registry = await fetch(REGISTRY_URL).then(r => r.json());
const repo = registry[skill];

if (!repo) {
  console.log("Skill not found:", skill);
  process.exit(1);
}

// 确定目标目录
const configDir = model === "claude-code" ? ".claude" : ".codex";
const skillsDir = path.resolve(process.cwd(), configDir, "skills");

// 创建 skills 文件夹（如果不存在）
if (!fs.existsSync(skillsDir)) {
  fs.mkdirSync(skillsDir, { recursive: true });
  console.log(`Created directory: ${skillsDir}`);
}

console.log(`Downloading skill: ${skill} to ${skillsDir}`);

// 下载到临时目录，然后移动到目标位置
const tempDir = path.resolve(__dirname, ".temp");
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir, { recursive: true });

await degit(repo).clone(tempDir);

// 移动文件到目标目录
const downloadedName = path.basename(repo);
let tempSkillDir = path.join(tempDir, downloadedName);

// 如果目录不存在，可能是 degit 下载到了其他位置，尝试直接使用 tempDir
if (!fs.existsSync(tempSkillDir)) {
  const entries = fs.readdirSync(tempDir, { withFileTypes: true });
  if (entries.length === 1 && entries[0].isDirectory) {
    tempSkillDir = path.join(tempDir, entries[0].name);
  } else {
    // 如果 tempDir 直接包含文件
    tempSkillDir = tempDir;
  }
}

const targetDir = path.join(skillsDir, downloadedName);

// 如果目标已存在，先删除
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true });
}

fs.cpSync(tempSkillDir, targetDir, { recursive: true });
fs.rmSync(tempDir, { recursive: true });

console.log("Done!");
