export interface SkillConfig {
  "project-name": string;
  skills: string[];
  apiKey: string;
}

export interface SkillJson {
  "skill-name": string;
  "skill-description": string;
}

export interface SkillInfo {
  desc: string;
  mainContent: string;
}

export interface PushSkillParams {
  repoUrl: string;
  skillName: string;
}

export interface UploadParams {
  filePath: string;
  skillName: string;
}

export interface FileValidationResult {
  absolutePath: string;
  fileName: string;
  size: number;
}

export interface CreateSkillParams {
  name: string;
  desc: string;
  mainContent: string;
  downloadUrl: string;
  apiKey: string;
}

export interface ProjectAnswers {
  projectName: string;
  apiKey: string;
}

export interface SkillAnswers {
  skillName: string;
  githubRepoUrl: string;
  confirm: boolean;
}

export interface FolderAnswers {
  folderName: string;
}

// 技能详情
export interface SkillDetail {
  id: string;
  name: string;
  downloads: number;
  desc: string;
  mainContent: string;
  downloadUrl: string;
  userId: string;
  createdAt: Date;
  skillCategoryId?: string;
}
