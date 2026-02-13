import axios from "axios";
import { downloadTemplate } from "giget";
import { SkillDetail } from "../../types";
import path from "path";
import chalk from "chalk";
import fs from "fs";

export const runUseSkillsWorkflow = async (name: string) => {
  console.log(chalk.blue(`Downloading skill ${name}...`));
  const skillDetail = await querySkillDetail(name);
  await downloadSkillTemplate(skillDetail.data);
  console.log(chalk.green(`Skill ${name} downloaded successfully!`));
};

// 根据技能名称查询技能详情
export const querySkillDetail = async (name: string) => {
  try {
    const response = await axios.get(`https://www.skill-hub.cn/api/skills`, {
      params: {
        name,
      },
    });
    return response.data;
  } catch (error) {
    console.error(chalk.red(`Error querying skill detail: ${error}`));
    throw error;
  }
};

// 根据id将skills+1
export const incrementSkillUsage = async (id: number) => {
  try {
    const response = await axios.put(`https://www.skill-hub.cn/api/skills`, {
      params: {
        id,
      },
    });
    return response.data;
  } catch (error) {
    console.error(chalk.red(`Error incrementing skill usage: ${error}`));
    throw error;
  }
};

// 下载技能模板
export const downloadSkillTemplate = async (skillDetail: SkillDetail) => {
  try {
    const targetDir = path.resolve(".agents/skills", skillDetail.name);

    // 创建目录（如果不存在）
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await downloadTemplate(`github:${skillDetail.downloadUrl}`, {
      dir: targetDir,
      force: true,
    });
  } catch (error) {
    console.error(chalk.red(`Error downloading skill template: ${error}`));
    throw error;
  }
};
