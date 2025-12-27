#!/usr/bin/env node

/**
 * 品牌化替换脚本
 * 将项目中的 Liubai/留白记事/Liu 相关内容替换为 Thus-Note/如是/Thus
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 定义替换规则
const replacements = [
  // 文件名和目录名替换（需要手动处理）
  // liubai → thus-note
  // liubai-docs → thus-docs

  // 文件内容替换
  { pattern: /liubai-docs/g, replacement: 'thus-docs' },
  { pattern: /liubai-frontends/g, replacement: 'thus-frontends' },
  { pattern: /liubai-web/g, replacement: 'thus-web' },
  { pattern: /liubai-vscode-extension/g, replacement: 'thus-vscode-extension' },
  { pattern: /liubai-weixin/g, replacement: 'thus-weixin' },
  { pattern: /liubai-laf/g, replacement: 'thus-laf' },
  { pattern: /liubai-ffmpeg/g, replacement: 'thus-ffmpeg' },

  // 留白记事 → 如是
  { pattern: /留白记事/g, replacement: '如是' },

  // 留白 → 如是
  { pattern: /留白/g, replacement: '如是' },

  // LiuDexie → ThusNoteDexie
  { pattern: /LiuDexie/g, replacement: 'ThusNoteDexie' },

  // 类名和变量名中的 Liu → Thus
  { pattern: /LiuAuthStatus/g, replacement: 'ThusAuthStatus' },
  { pattern: /LiuRqOpt/g, replacement: 'ThusRqOpt' },
  { pattern: /LiuRqReturn/g, replacement: 'ThusRqReturn' },
  { pattern: /LiuRouter/g, replacement: 'ThusRouter' },
  { pattern: /LiuAvatar/g, replacement: 'ThusAvatar' },
  { pattern: /LiuMenu/g, replacement: 'ThusMenu' },
  { pattern: /LiuCheckbox/g, replacement: 'ThusCheckbox' },
  { pattern: /LiuSwitch/g, replacement: 'ThusSwitch' },
  { pattern: /LiuJSZip/g, replacement: 'ThusJSZip' },
  { pattern: /LiuFileStore/g, replacement: 'ThusFileStore' },
  { pattern: /LiuImageStore/g, replacement: 'ThusImageStore' },
  { pattern: /LiuMyContext/g, replacement: 'ThusMyContext' },
  { pattern: /LiuExportContentJSON/g, replacement: 'ThusExportContentJSON' },
  { pattern: /LiuAtomState/g, replacement: 'ThusAtomState' },
  { pattern: /LiuAppType/g, replacement: 'ThusAppType' },
  { pattern: /LiuRemindMe/g, replacement: 'ThusRemindMe' },
  { pattern: /LiuSpaceAndMember/g, replacement: 'ThusSpaceAndMember' },
  { pattern: /LiuTimeout/g, replacement: 'ThusTimeout' },
  { pattern: /LiuDownloadParcel/g, replacement: 'ThusDownloadParcel' },

  // API 和函数名中的 Liu → Thus
  { pattern: /liu-api/g, replacement: 'thus-api' },
  { pattern: /liu-util/g, replacement: 'thus-util' },
  { pattern: /liu-env/g, replacement: 'thus-env' },
  { pattern: /liu-console/g, replacement: 'thus-console' },
  { pattern: /liu-info/g, replacement: 'thus-info' },
  { pattern: /liu-req/g, replacement: 'thus-req' },
  { pattern: /liuDesc/g, replacement: 'thusDesc' },

  // CSS 类名中的 liu- → thus-
  { pattern: /liu-simple-page/g, replacement: 'thus-simple-page' },
  { pattern: /liu-mc-container/g, replacement: 'thus-mc-container' },
  { pattern: /liu-mc-box/g, replacement: 'thus-mc-box' },
  { pattern: /liu-no-user-select/g, replacement: 'thus-no-user-select' },
  { pattern: /liu-hover/g, replacement: 'thus-hover' },
  { pattern: /liu-selection/g, replacement: 'thus-selection' },
  { pattern: /liu-highlight-box/g, replacement: 'thus-highlight-box' },
  { pattern: /liu-frosted-glass/g, replacement: 'thus-frosted-glass' },
  { pattern: /liu-switching-theme/g, replacement: 'thus-switching-theme' },
  { pattern: /liu-dark/g, replacement: 'thus-dark' },
  { pattern: /liu-view/g, replacement: 'thus-view' },

  // 图标类名
  { pattern: /liu-github/g, replacement: 'thus-github' },
  { pattern: /liu-auto-toggle/g, replacement: 'thus-auto-toggle' },
  { pattern: /liu-smartphone/g, replacement: 'thus-smartphone' },
  { pattern: /liu-app-window/g, replacement: 'thus-app-window' },
  { pattern: /liu-translate-svg/g, replacement: 'thus-translate-svg' },
  { pattern: /liu-search-one/g, replacement: 'thus-search-one' },
  { pattern: /liu-state/g, replacement: 'thus-state' },
  { pattern: /liu-quote/g, replacement: 'thus-quote' },

  // 环境变量
  { pattern: /LIU_ENV/g, replacement: 'THUS_ENV' },

  // 其他
  { pattern: /useLiuWatch/g, replacement: 'useThusWatch' },
];

// 需要排除的目录和文件
const excludeDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'plans',
  'scripts',
];

// 需要处理的文件扩展名
const includeExtensions = [
  '.js',
  '.ts',
  '.vue',
  '.json',
  '.md',
  '.html',
  '.css',
  '.scss',
  '.svg',
];

/**
 * 递归获取所有需要处理的文件
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // 跳过排除的目录
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      // 检查文件扩展名
      const ext = path.extname(file);
      if (includeExtensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 应用所有替换规则
    replacements.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        modified = true;
        content = newContent;
      }
    });

    // 如果文件被修改，写回文件
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ 已处理: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ 处理失败: ${filePath}`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始品牌化替换...\n');

  const rootDir = process.cwd();
  const files = getAllFiles(rootDir);

  console.log(`找到 ${files.length} 个文件需要检查\n`);

  let processedCount = 0;
  let modifiedCount = 0;

  files.forEach(file => {
    processedCount++;
    if (processFile(file)) {
      modifiedCount++;
    }
  });

  console.log(`\n处理完成！`);
  console.log(`- 检查文件: ${processedCount}`);
  console.log(`- 修改文件: ${modifiedCount}`);
  console.log(`- 未修改: ${processedCount - modifiedCount}`);

  console.log('\n注意事项:');
  console.log('1. 文件名和目录名需要手动重命名');
  console.log('2. 某些特殊情况可能需要手动检查');
  console.log('3. 建议运行 git diff 查看所有更改');
  console.log('4. 测试前请确保所有替换都正确');
}

// 运行主函数
main();
