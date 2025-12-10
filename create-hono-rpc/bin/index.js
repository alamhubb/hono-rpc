#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { cyan, green, red, yellow } from 'kolorist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log();
  console.log(cyan('🚀 Create Hono RPC Project'));
  console.log();

  // 获取项目名称
  let projectName = process.argv[2];
  
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-hono-rpc-app',
    });
    projectName = response.projectName;
  }

  if (!projectName) {
    console.log(red('✖ Project name is required'));
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  // 检查目录是否存在
  if (fs.existsSync(targetDir)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory "${projectName}" already exists. Overwrite?`,
      initial: false,
    });
    if (!overwrite) {
      console.log(red('✖ Operation cancelled'));
      process.exit(1);
    }
    fs.rmSync(targetDir, { recursive: true });
  }

  // 创建目录
  fs.mkdirSync(targetDir, { recursive: true });

  // 复制模板
  const templateDir = path.resolve(__dirname, '../templates/default');
  copyDir(templateDir, targetDir);

  // 更新 package.json 中的项目名
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  console.log();
  console.log(green('✔ Project created successfully!'));
  console.log();
  console.log('Next steps:');
  console.log();
  console.log(cyan(`  cd ${projectName}`));
  console.log(cyan('  npm install'));
  console.log(cyan('  npm run dev'));
  console.log();
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stat = fs.statSync(srcFile);
    if (stat.isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
