import inquirer from "inquirer";
import axios from "axios";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import FormData from "form-data";

export const runPushWorkflow = async () => {
  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "skillName",
        message: "Enter your skill name:",
      },
    ]);

    const archivePath = await selectFile({ fileName: answers.skillName });
    await upload({ filePath: archivePath, skillName: answers.skillName });
  } catch (error) {
    console.error(error);
  }
};

async function validateFile(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    throw new Error(`Path is a directory, not a file: ${absolutePath}`);
  }

  const MAX_SIZE = 3 * 1024 * 1024;
  if (stat.size > MAX_SIZE) {
    throw new Error(
      `File size exceeds 3MB limit (current: ${(stat.size / 1024 / 1024).toFixed(2)}MB)`,
    );
  }

  return {
    absolutePath,
    fileName: path.basename(absolutePath),
    size: stat.size,
  };
}

async function getApiKey() {
  const configPath = path.resolve("skills.register.json");
  const configContent = await fs.promises.readFile(configPath, "utf8");
  const config = JSON.parse(configContent);

  if (!config.apiKey) {
    throw new Error("apiKey not found in skills.register.json");
  }

  return config.apiKey;
}

async function getSkillInfo(skillName) {
  const skillDir = path.resolve(skillName);

  const skillsJsonPath = path.join(skillDir, "skills.json");
  const skillMdPath = path.join(skillDir, "SKILL.md");

  if (!fs.existsSync(skillsJsonPath)) {
    throw new Error(`skills.json not found: ${skillsJsonPath}`);
  }
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found: ${skillMdPath}`);
  }

  const skillsJsonContent = await fs.promises.readFile(skillsJsonPath, "utf8");
  const skillsJson = JSON.parse(skillsJsonContent);

  const mainContent = await fs.promises.readFile(skillMdPath, "utf8");

  return {
    desc: skillsJson["skill-description"] || "",
    mainContent,
  };
}

async function createUploadFormData(absolutePath, fileName, apiKey) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(absolutePath));
  formData.append("fileName", fileName.replace(".zip", ""));
  formData.append("apiKey", apiKey);
  return formData;
}

async function doUpload(formData) {
  const response = await axios.post(
    "http://localhost:3000/api/uploads",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    },
  );
  return response.data;
}

// upload
export const upload = async ({ filePath, skillName }) => {
  try {
    const { absolutePath, fileName, size } = await validateFile(filePath);
    console.log(
      `Uploading: ${fileName} (${(size / 1024 / 1024).toFixed(2)}MB) ...`,
    );

    const apiKey = await getApiKey();
    const { desc, mainContent } = await getSkillInfo(skillName);
    const formData = await createUploadFormData(absolutePath, fileName, apiKey);

    const responseData = await doUpload(formData);

    await createSkill({
      name: fileName.replace(".zip", ""),
      desc,
      mainContent,
      downloadUrl: responseData.url,
      apiKey,
    });
    console.log("Skill created successfully!!!");
  } catch (e) {
    if (e.response) {
      console.error("Server response:", e.response.status, e.response.data);
    }
    console.error("Upload failed:", e.message);
    throw e;
  }
};

// 使用 archiver 生成 zip（跨平台）
function createZip(sourcePath, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    fs.promises
      .stat(sourcePath)
      .then((stat) => {
        if (stat.isDirectory()) {
          // 第二个参数为 false，表示不保留源目录这一层，只打包内部内容
          archive.directory(sourcePath, false);
        } else {
          archive.file(sourcePath, { name: path.basename(sourcePath) });
        }
        archive.finalize();
      })
      .catch((err) => reject(err));
  });
}

// 遍历项目，查找与 fileName 同名的文件或文件夹
async function findTargetPath(rootDir, fileName) {
  const ignoreDirs = new Set(["node_modules", ".git", "dist", ".cursor"]);

  const walk = async (currentDir) => {
    const entries = await fs.promises.readdir(currentDir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (ignoreDirs.has(entry.name)) continue;

      const fullPath = path.join(currentDir, entry.name);

      if (entry.name === fileName) {
        return fullPath;
      }

      if (entry.isDirectory()) {
        const result = await walk(fullPath);
        if (result) return result;
      }
    }

    return null;
  };

  return walk(rootDir);
}

// 为压缩包准备 dist 目录和输出路径
async function prepareArchivePath(rootDir, fileName) {
  const distDir = path.join(rootDir, "dist");
  await fs.promises.mkdir(distDir, { recursive: true });

  const archivePath = path.join(distDir, `${fileName}.zip`);

  // 如果之前已经存在同名压缩包，先删除
  try {
    await fs.promises.unlink(archivePath);
  } catch {
    // ignore
  }

  return archivePath;
}

// select file
async function selectFile({ fileName }) {
  // 从根目录遍历文件夹找到和 fileName 相同的文件/文件夹，
  // 然后压缩到根目录下 dist 目录中，名称为 `${fileName}.zip`
  const rootDir = process.cwd();

  const targetPath = await findTargetPath(rootDir, fileName);

  if (!targetPath) {
    throw new Error(`未在项目中找到名为 "${fileName}" 的文件或文件夹`);
  }

  const archivePath = await prepareArchivePath(rootDir, fileName);

  try {
    await createZip(targetPath, archivePath);
  } catch (error) {
    console.error("压缩失败:", error);
    throw error;
  }

  console.log(`已生成压缩包: ${archivePath}`);
  return archivePath;
}

// 创建skills
async function createSkill({ name, desc, mainContent, downloadUrl, apiKey }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("desc", desc);
  formData.append("mainContent", mainContent);
  formData.append("downloadUrl", downloadUrl);
  formData.append("apiKey", apiKey);

  const res = await axios.post("http://localhost:3000/api/skills", formData, {
    headers: {
      ...formData.getHeaders(),
    },
  });
  return res.data;
}
