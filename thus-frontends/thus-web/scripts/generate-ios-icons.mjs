#!/usr/bin/env node
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 输入和输出路径
const inputSvg = join(projectRoot, 'public/favicon.svg');
const outputDir = join(projectRoot, 'public/logos');

// 确保输出目录存在
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// iOS 需要的图标尺寸
const iosSizes = [
  { size: 180, name: 'apple-touch-icon.png' },  // iOS 默认尺寸
  { size: 192, name: 'for_ios_192x192_v1.png' },
  { size: 256, name: 'for_ios_256x256_v1.png' },
  { size: 512, name: 'for_ios_512x512_v1.png' },
];

// 其他需要的图标尺寸
const otherSizes = [
  { size: 16, name: 'logo_16x16_v2.png' },
  { size: 32, name: 'logo_32x32_v2.png' },
  { size: 192, name: 'logo_192x192_v2.png' },
  { size: 256, name: 'logo_256x256_v3.png' },
  { size: 512, name: 'logo_512x512_v2.png' },
];

// PWA maskable icons (需要额外的padding)
const maskableSizes = [
  { size: 192, name: 'maskable_192x192_v1.png', padding: 20 },
  { size: 256, name: 'maskable_256x256_v1.png', padding: 26 },
  { size: 512, name: 'maskable_512x512_v1.png', padding: 52 },
];

console.log('🎨 开始生成图标...\n');

// 生成 iOS 图标
console.log('📱 生成 iOS Apple Touch Icons:');
for (const { size, name } of iosSizes) {
  try {
    await sharp(inputSvg)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // 白色背景
      })
      .png()
      .toFile(join(outputDir, name));
    console.log(`  ✅ ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`  ❌ ${name} 生成失败:`, error.message);
  }
}

// 生成其他图标
console.log('\n🖼️  生成其他图标:');
for (const { size, name } of otherSizes) {
  try {
    await sharp(inputSvg)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
      })
      .png()
      .toFile(join(outputDir, name));
    console.log(`  ✅ ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`  ❌ ${name} 生成失败:`, error.message);
  }
}

// 生成 maskable 图标（带 padding）
console.log('\n🎭 生成 PWA Maskable Icons:');
for (const { size, name, padding } of maskableSizes) {
  try {
    const innerSize = size - (padding * 2);
    await sharp(inputSvg)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // 白色背景
      })
      .png()
      .toFile(join(outputDir, name));
    console.log(`  ✅ ${name} (${size}x${size} with ${padding}px padding)`);
  } catch (error) {
    console.error(`  ❌ ${name} 生成失败:`, error.message);
  }
}

console.log('\n✨ 图标生成完成！');
console.log('\n📝 下一步:');
console.log('  1. 重新构建前端: pnpm build');
console.log('  2. 清除浏览器缓存');
console.log('  3. 在 iOS Safari 中重新添加到主屏幕\n');
