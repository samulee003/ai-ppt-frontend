// AI PPT Generator - Simplified JavaScript

// --- Global State ---
let uploadedTemplateFile = null;

// --- DOM Elements ---
const uploadArea = document.getElementById('uploadArea');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const contentText = document.getElementById('contentText');
const generateBtn = document.getElementById('generateBtn');

const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const resultsContainer = document.getElementById('results');
const downloadLink = document.getElementById('downloadLink');

const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    // File Upload Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Generation Listener
    generateBtn.addEventListener('click', handleGeneratePPT);
}

// --- UI Update Functions ---

function showProgress(message, percentage) {
    resultsContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    progressContainer.style.display = 'block';
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = message;
}

function showSuccess(blob, filename) {
    progressContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    resultsContainer.style.display = 'block';

    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = filename || 'generated_presentation.pptx';
}

function showError(message) {
    progressContainer.style.display = 'none';
    resultsContainer.style.display = 'none';
    errorContainer.style.display = 'block';
    
    errorMessage.textContent = message || '發生未知錯誤，請檢查後端日誌或稍後再試。';
}

function updateUploadDisplay(file) {
    const uploadContent = uploadArea.querySelector('.upload-area__content');
    if (file) {
        uploadContent.innerHTML = `
            <div class="upload-area__icon">✅</div>
            <h3 class="upload-area__title">模板已選取</h3>
            <p class="upload-area__description">${escapeHtml(file.name)}</p>
            <button class="btn btn--outline upload-btn">重新選擇</button>
        `;
    } else {
        uploadContent.innerHTML = `
            <div class="upload-area__icon">📁</div>
            <h3 class="upload-area__title">分析您的設計風格</h3>
            <p class="upload-area__description">拖拽一個 .pptx 模板文件到此處，或點擊按鈕選擇</p>
            <button class="btn btn--outline upload-btn">選擇模板文件</button>
        `;
    }

    // Re-bind the button inside the new content
    uploadContent.querySelector('.upload-btn').addEventListener('click', () => fileInput.click());
}

// --- File Handling Logic ---

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave() {
    uploadArea.classList.remove('drag-over');
}

function handleFileDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    if (!file.name.endsWith('.pptx')) {
        showError('請上傳 .pptx 格式的 PowerPoint 模板文件。');
        uploadedTemplateFile = null;
        updateUploadDisplay(null);
        return;
    }
    uploadedTemplateFile = file;
    updateUploadDisplay(file);
    // Clear any previous error/success messages
    errorContainer.style.display = 'none';
    resultsContainer.style.display = 'none';
}

// --- Core API Logic ---

async function handleGeneratePPT() {
    if (!uploadedTemplateFile) {
        showError('請先上傳一個 PPT 模板文件。');
        return;
    }
    if (!contentText.value.trim()) {
        showError('請輸入簡報大綱內容。');
        return;
    }

    showProgress('正在準備上傳...', 0);

    const formData = new FormData();
    formData.append('template_file', uploadedTemplateFile);
    formData.append('presentation_content', contentText.value);

    try {
        showProgress('正在上傳檔案並生成簡報...', 30);

        // NOTE: Replace '/api/generate_from_template' with your actual backend endpoint
        const response = await fetch('/api/generate_from_template', {
            method: 'POST',
            body: formData,
        });

        showProgress('後端處理中，請稍候...', 70);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `伺服器錯誤，狀態碼: ${response.status}` }));
            throw new Error(errorData.error);
        }

        const blob = await response.blob();
        showSuccess(blob, `generated_${Date.now()}.pptx`);

    } catch (err) {
        console.error('Generation failed:', err);
        showError(err.message);
    }
}

// --- Utility Functions ---

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}