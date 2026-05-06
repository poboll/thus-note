const fs = require("fs")
const path = require("path")

const configPath = "/www/server/panel/vhost/nginx/thus.caiths.com.conf"
const extensionDir = "/www/server/panel/vhost/nginx/extension/thus.caiths.com"
const extensionPath = path.join(extensionDir, "pwa-cache.conf")
const sourceExtensionPath = path.join(__dirname, "thus.caiths.com.pwa-cache.conf")

let content = fs.readFileSync(configPath, "utf8")

const locationBlockPattern = /(\n\s*# 前端 SPA\s*\n\s*location \/ \{\s*\n\s*try_files \$uri \$uri\/ \/index\.html;\s*\n)([\s\S]*?)(\s*\})/
const cacheHeaderLine = '        add_header Cache-Control "no-cache, no-store, must-revalidate" always;\n'

if (!locationBlockPattern.test(content)) {
  throw new Error("Failed to locate SPA location block in nginx config")
}

content = content.replace(locationBlockPattern, (_match, prefix, middle, suffix) => {
  if (middle.includes('add_header Cache-Control "no-cache, no-store, must-revalidate" always;')) {
    return `${prefix}${middle}${suffix}`
  }
  return `${prefix}${cacheHeaderLine}${suffix}`
})

fs.writeFileSync(configPath, content)
fs.mkdirSync(extensionDir, { recursive: true })
fs.copyFileSync(sourceExtensionPath, extensionPath)
