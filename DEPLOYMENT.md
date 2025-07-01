# AI PPT Generator 前端 - 部署指南 🚀

## 🌟 部署選項

### 1. 靜態網站託管（推薦）

#### GitHub Pages
```bash
# 1. 在 GitHub 倉庫設定中啟用 Pages
# 2. 選擇 main 分支作為來源
# 3. 訪問 https://samulee003.github.io/ai-ppt-frontend
```

#### Netlify
```bash
# 1. 連接 GitHub 倉庫到 Netlify
# 2. 設定構建命令：echo "No build needed"
# 3. 設定輸出目錄：.
# 4. 自動部署完成
```

#### Vercel
```bash
# 1. 導入 GitHub 倉庫到 Vercel
# 2. 框架選擇：Other
# 3. 自動部署到全球 CDN
```

### 2. 本地開發服務器

#### Python HTTP Server
```bash
cd ai-ppt-frontend
python -m http.server 8000
# 訪問 http://localhost:8000
```

#### Node.js Serve
```bash
cd ai-ppt-frontend
npx serve .
# 自動分配端口
```

#### Live Server (VS Code)
```bash
# 安裝 Live Server 擴展
# 右鍵 index.html → Open with Live Server
```

## ⚙️ 配置後端 API

### 開發環境
```javascript
// 在 app.js 中設定
const API_BASE_URL = 'http://localhost:5000/api';
```

### 生產環境
```javascript
// 修改為你的後端 URL
const API_BASE_URL = 'https://your-backend.zeabur.app/api';
```

### 自動偵測
```javascript
// 自動根據環境選擇
const API_BASE_URL = location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://your-backend.zeabur.app/api';
```

## 🌐 HTTPS 和域名

### 自定義域名
```bash
# 1. 在託管平台設定自定義域名
# 2. 配置 DNS CNAME 記錄
# 3. 自動獲得 SSL 證書
```

### CORS 配置
確保後端正確配置 CORS：
```python
# 後端需要允許你的前端域名
CORS_ORIGINS = [
    'https://your-frontend-domain.com',
    'https://samulee003.github.io'
]
```

## 📊 性能優化

### 文件壓縮
```bash
# 如需要，可以壓縮 JS/CSS
npx terser app.js -o app.min.js
npx clean-css style.css -o style.min.css
```

### CDN 優化
```html
<!-- 使用 CDN 加載圖標 -->
<script src="https://unpkg.com/feather-icons"></script>
```

## 🔧 環境變數

### 配置檔案
```javascript
// config.js
const CONFIG = {
  API_BASE_URL: process.env.API_URL || 'http://localhost:5000/api',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  VERSION: '1.0.0'
};
```

## 🚀 CI/CD 自動部署

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 📱 PWA 設定（可選）

### Service Worker
```javascript
// sw.js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('ai-ppt-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.js',
        '/style.css'
      ]);
    })
  );
});
```

### Manifest
```json
// manifest.json
{
  "name": "AI PPT Generator",
  "short_name": "AI PPT",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#667eea",
  "background_color": "#ffffff"
}
```

---

**🎯 選擇最適合你的部署方式，開始使用 AI PPT Generator！** 