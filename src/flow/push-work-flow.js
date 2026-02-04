import inquirer from "inquirer";
import axios from "axios";
import fs from "fs";
import path from "path";
import archiver from "archiver";

export const runPushWorkflow = async () => {
  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "skillName",
        message: "Enter your skill name:",
      },
    ]);

    selectFile({ fileName: answers.skillName });
  } catch (error) {
    console.error(error);
  }
};

// upload
export const upload = async ({ skillName }) => {
  try {
    await axios.post("http://localhost:3000/api/uploads", {
      fileName: skillName,
    });
  } catch (e) {
    console.error(e);
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
