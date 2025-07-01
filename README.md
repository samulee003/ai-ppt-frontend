# AI PPT Generator - 前端專案 🎨

這是 AI PPT Generator 的前端用戶界面，提供現代化的 Web 介面來與 AI PPT 生成服務互動。

## 🌟 特色功能

- **📁 檔案上傳**: 拖拽式 PPT 模板上傳介面
- **🎯 智能參數**: 簡潔的內容輸入和設定面板
- **👀 即時預覽**: 生成過程的視覺化回饋
- **📊 進度追蹤**: 清晰的處理狀態指示器
- **🎨 現代設計**: 響應式設計，支援暗色模式
- **⭐ 用戶評分**: 結果評分和回饋系統

## 🏗️ 技術架構

- **Framework**: 原生 JavaScript（無依賴）
- **樣式**: 自定義 CSS 設計系統
- **圖標**: Feather Icons
- **響應式**: 支援桌面和行動裝置
- **主題**: 亮色/暗色模式切換

## 📂 檔案結構

```
ai-ppt-frontend/
├── index.html          # 主頁面
├── app.js              # 主要 JavaScript 邏輯
├── style.css           # 樣式表
├── static/             # 靜態資源
├── templates/          # 模板文件
└── README.md           # 專案說明
```

## 🚀 快速開始

### 本地開發

1. **克隆專案**
   ```bash
   git clone https://github.com/samulee003/ai-ppt-frontend.git
   cd ai-ppt-frontend
   ```

2. **啟動本地服務器**
   ```bash
   # 使用 Python
   python -m http.server 8000
   
   # 或使用 Node.js
   npx serve .
   
   # 或使用 Live Server (VS Code 擴展)
   ```

3. **訪問應用**
   - 打開瀏覽器訪問：http://localhost:8000

### 與後端整合

確保後端服務正在運行：
- 後端專案：https://github.com/samulee003/ai-ppt-backend
- 默認後端地址：http://localhost:5000

## ⚙️ 配置

### API 端點配置

在 `app.js` 中修改後端 API 基礎地址：

```javascript
const API_BASE_URL = 'http://localhost:5000/api';  // 本地開發
// const API_BASE_URL = 'https://your-backend.zeabur.app/api';  // 生產環境
```

### 功能開關

```javascript
const CONFIG = {
    enableDarkMode: true,
    enableNotifications: true,
    enableDragDrop: true,
    maxFileSize: 50 * 1024 * 1024,  // 50MB
    supportedFormats: ['.ppt', '.pptx']
};
```

## 🎨 UI 組件

### 主要介面區塊

1. **檔案上傳區域**
   - 拖拽上傳支援
   - 檔案格式驗證
   - 上傳進度顯示

2. **內容輸入面板**
   - 主題設定
   - 內容類型選擇
   - 風格偏好設定

3. **生成結果預覽**
   - 幻燈片縮圖顯示
   - 下載和分享選項
   - 用戶評分介面

4. **系統通知**
   - 成功/錯誤提示
   - 處理狀態更新
   - 用戶操作回饋

## 🔧 開發指南

### 添加新功能

1. **新增 UI 組件**
   ```javascript
   function createNewComponent(options) {
       const element = document.createElement('div');
       element.className = 'new-component';
       // 實作邏輯
       return element;
   }
   ```

2. **API 調用模式**
   ```javascript
   async function callAPI(endpoint, data) {
       try {
           const response = await fetch(`${API_BASE_URL}${endpoint}`, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}`
               },
               body: JSON.stringify(data)
           });
           return await response.json();
       } catch (error) {
           console.error('API 調用失敗:', error);
           showNotification('操作失敗，請稍後重試', 'error');
       }
   }
   ```

### 樣式自定義

主要 CSS 變數定義在 `:root` 中：

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
}
```

## 📱 響應式設計

支援的斷點：
- **Desktop**: ≥ 1024px
- **Tablet**: 768px - 1023px  
- **Mobile**: < 768px

## 🤝 與後端 API 對接

### 認證流程

```javascript
// 用戶登入
const loginData = await callAPI('/auth/login', {
    username: 'user',
    password: 'password'
});

// 儲存 Token
localStorage.setItem('token', loginData.token);
```

### 主要 API 端點

- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/register` - 用戶註冊  
- `POST /api/upload` - 檔案上傳
- `POST /api/analyze` - 模板分析
- `POST /api/generate` - 生成簡報
- `GET /api/templates` - 獲取模板列表

## 🔍 除錯指南

### 常見問題

1. **CORS 錯誤**
   - 確保後端正確配置 CORS
   - 檢查 API 基礎地址設定

2. **檔案上傳失敗**
   - 檢查檔案大小限制
   - 驗證檔案格式支援

3. **認證問題**
   - 確認 Token 未過期
   - 檢查 Authorization 標頭

### 除錯工具

```javascript
// 開啟除錯模式
const DEBUG_MODE = true;

function debugLog(message, data) {
    if (DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, data);
    }
}
```

## 📄 授權

MIT License - 詳見 LICENSE 文件

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**🎯 一個現代化的 AI PPT 生成器前端界面，讓 AI 創造變得簡單有趣！** 