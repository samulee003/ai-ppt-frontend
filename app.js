// AI PPT Generator JavaScript

// Application state
let appState = {
    uploadedFiles: [],
    currentRating: 0,
    generatedSlides: [],
    isGenerating: false,
    currentPresentationId: null
};

// Security utility functions
function escapeHtml(text) {
    """HTML轉義函數，防止XSS攻擊"""
    if (typeof text !== 'string') {
        return text;
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeUserInput(input) {
    """清理用戶輸入，移除潛在的惡意內容"""
    if (typeof input !== 'string') {
        return input;
    }
    // 移除可能的腳本標籤和事件處理器
    return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/data:/gi, '');
}

function createSafeElement(tagName, textContent, className) {
    """安全創建DOM元素"""
    const element = document.createElement(tagName);
    if (textContent) {
        element.textContent = textContent; // 使用textContent而非innerHTML
    }
    if (className) {
        element.className = className;
    }
    return element;
}

// Sample slide templates for demonstration
const slideTemplates = [
    { title: '標題頁', content: '主標題與副標題' },
    { title: '目錄', content: '章節概覽' },
    { title: '問題陳述', content: '要解決的核心問題' },
    { title: '解決方案', content: '我們的解決方案' },
    { title: '產品特色', content: '核心功能與優勢' },
    { title: '市場分析', content: '目標市場與競爭分析' },
    { title: '商業模式', content: '營收模式與策略' },
    { title: '團隊介紹', content: '核心團隊成員' },
    { title: '財務預測', content: '收入與成本預測' },
    { title: '時程規劃', content: '專案里程碑' },
    { title: '風險評估', content: '潛在風險與對策' },
    { title: '結論', content: '總結與行動方案' },
    { title: '問答時間', content: '感謝聆聽' }
];

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const slideCountSlider = document.getElementById('slideCount');
const slideCountValue = document.getElementById('slideCountValue');
const generateBtn = document.getElementById('generateBtn');
const generateBtnText = document.querySelector('.generate-btn__text');
const loadingSpinner = document.getElementById('loadingSpinner');
const previewArea = document.getElementById('previewArea');
const slideThumbnails = document.getElementById('slideThumbnails');
const previewControls = document.getElementById('previewControls');
const starRating = document.getElementById('starRating');
const ratingText = document.getElementById('ratingText');
const feedbackText = document.getElementById('feedbackText');
const improveFeedbackBtn = document.getElementById('improveFeedbackBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const modifyBtn = document.getElementById('modifyBtn');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateSlideCountDisplay();
});

// Initialize all event listeners
function initializeEventListeners() {
    // File upload events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    fileInput.addEventListener('change', handleFileSelect);

    // Slider event
    slideCountSlider.addEventListener('input', updateSlideCountDisplay);

    // Generation events
    generateBtn.addEventListener('click', handleGeneratePPT);
    regenerateBtn.addEventListener('click', handleRegeneratePPT);
    modifyBtn.addEventListener('click', handleModifySlides);

    // Rating events
    const stars = starRating.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', handleStarClick);
        star.addEventListener('mouseenter', handleStarHover);
    });
    starRating.addEventListener('mouseleave', resetStarHover);

    // Feedback event
    improveFeedbackBtn.addEventListener('click', handleFeedbackSubmit);

    // Feature card hover effects
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
    });
}

// File upload handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleFileDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

async function processFiles(files) {
    const pptFiles = files.filter(file => 
        file.type.includes('presentation') || 
        file.name.endsWith('.ppt') || 
        file.name.endsWith('.pptx')
    );

    if (pptFiles.length === 0) {
        showNotification('請選擇 PowerPoint 檔案 (.ppt 或 .pptx)', 'warning');
        return;
    }

    // 逐個上傳文件到後端
    for (const file of pptFiles) {
        try {
            showNotification(`正在上傳 ${file.name}...`, 'info');
            
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                appState.uploadedFiles.push({
                    file: file,
                    template_id: result.template_id,
                    template: result.template
                });
                showNotification(`${file.name} 上傳成功`, 'success');
            } else {
                showNotification(`${file.name} 上傳失敗：${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification(`${file.name} 上傳失敗：網路錯誤`, 'error');
        }
    }

    updateUploadDisplay();
}

function updateUploadDisplay() {
    const uploadContent = uploadArea.querySelector('.upload-area__content');
    const fileCount = appState.uploadedFiles.length;
    
    if (fileCount > 0) {
        uploadContent.innerHTML = `
            <div class="upload-area__icon">✅</div>
            <h3 class="upload-area__title">已上傳 ${fileCount} 個模板</h3>
            <p class="upload-area__description">AI 正在學習您的設計風格...</p>
            <button class="btn btn--outline upload-btn">繼續添加模板</button>
        `;
        
        // 重新綁定上傳按鈕事件
        const newUploadBtn = uploadContent.querySelector('.upload-btn');
        newUploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }
}

// Slide count slider
function updateSlideCountDisplay() {
    slideCountValue.textContent = slideCountSlider.value;
}

// PPT Generation
async function handleGeneratePPT() {
    if (appState.isGenerating) return;

    const contentText = document.getElementById('contentText').value.trim();
    const presentationType = document.getElementById('presentationType').value;
    const slideCount = parseInt(slideCountSlider.value);

    if (!contentText) {
        showNotification('請輸入簡報內容', 'warning');
        return;
    }

    appState.isGenerating = true;
    showLoading(true);

    try {
        // 先獲取智能內容建議
        showNotification('AI正在分析您的內容...', 'info');
        const suggestionsResponse = await fetch('/api/content-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content_text: contentText,
                presentation_type: presentationType,
                slide_count: slideCount,
                target_audience: 'general'
            })
        });

        const suggestionsResult = await suggestionsResponse.json();
        if (suggestionsResult.success) {
            showNotification('內容分析完成，正在生成PPT...', 'info');
            displayContentAnalysis(suggestionsResult.suggestions);
        }

        // 調用後端 API 生成完整 PPT
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content_text: contentText,
                presentation_type: presentationType,
                slide_count: slideCount,
                target_audience: 'general',
                template_id: appState.uploadedFiles.length > 0 ? appState.uploadedFiles[0].template_id : null
            })
        });

        const result = await response.json();

        if (result.success) {
            appState.generatedSlides = result.slides;
            appState.currentPresentationId = result.presentation_id;
            
            // 儲存AI生成的額外信息
            appState.visualSuggestions = result.visual_suggestions;
            appState.contentAnalysis = result.content_analysis;
            appState.generationMetadata = result.generation_metadata;
            
            // Display preview with enhanced information
            displaySlidePreview();
            displayAIInsights(result);
            showNotification(`AI智能PPT生成完成！質量分數：${(result.generation_metadata.quality_score * 100).toFixed(0)}%`, 'success');
        } else {
            showNotification(`生成失敗：${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Generation error:', error);
        showNotification('生成過程中發生網路錯誤，請重試', 'error');
    } finally {
        appState.isGenerating = false;
        showLoading(false);
    }
}

async function handleRegeneratePPT() {
    showNotification('正在重新生成...', 'info');
    await handleGeneratePPT();
}

function handleModifySlides() {
    showNotification('修改功能開發中...', 'info');
}

function showLoading(show) {
    if (show) {
        generateBtnText.textContent = '正在生成...';
        loadingSpinner.classList.remove('hidden');
        generateBtn.disabled = true;
    } else {
        generateBtnText.textContent = '生成 PPT';
        loadingSpinner.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

function simulateAIProcessing() {
    return new Promise(resolve => {
        setTimeout(resolve, 2000 + Math.random() * 1000);
    });
}

function generateSlides(content, type, count) {
    // Parse content and generate slides
    const lines = content.split('\n').filter(line => line.trim());
    const slides = [];
    
    // Always include title slide
    slides.push({
        title: '簡報標題',
        content: '基於您的內容智能生成',
        type: 'title'
    });

    // Generate content slides
    let slideIndex = 1;
    for (let i = 0; i < Math.min(count - 1, slideTemplates.length - 1); i++) {
        const template = slideTemplates[slideIndex % slideTemplates.length];
        const contentLine = lines[i % lines.length] || `${template.content}`;
        
        slides.push({
            title: template.title,
            content: contentLine.length > 50 ? contentLine.substring(0, 50) + '...' : contentLine,
            type: 'content'
        });
        slideIndex++;
    }

    return slides.slice(0, count);
}

function displayContentAnalysis(suggestions) {
    // 在預覽區域之前顯示內容分析結果
    const analysisContainer = document.createElement('div');
    analysisContainer.className = 'content-analysis';
    
    // 安全創建分析標題
    const header = document.createElement('div');
    header.className = 'analysis-header';
    const headerTitle = createSafeElement('h3', '📊 AI內容分析');
    header.appendChild(headerTitle);
    
    // 安全創建統計信息
    const statsContainer = document.createElement('div');
    statsContainer.className = 'analysis-stats';
    
    const contentAnalysis = suggestions.content_analysis || {};
    
    // 創建統計項目
    const createStatItem = (label, value) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        
        const statLabel = createSafeElement('span', label, 'stat-label');
        const statValue = createSafeElement('span', escapeHtml(sanitizeUserInput(value)), 'stat-value');
        
        statItem.appendChild(statLabel);
        statItem.appendChild(statValue);
        return statItem;
    };
    
    // 安全處理主題數組
    const mainThemes = Array.isArray(contentAnalysis.main_themes) 
        ? contentAnalysis.main_themes.map(theme => escapeHtml(sanitizeUserInput(theme))).join(', ')
        : '通用主題';
    
    statsContainer.appendChild(createStatItem('內容類型：', getContentTypeLabel(contentAnalysis.content_type)));
    statsContainer.appendChild(createStatItem('複雜度：', getComplexityLabel(contentAnalysis.complexity_level)));
    statsContainer.appendChild(createStatItem('字數：', (contentAnalysis.word_count || 0).toString()));
    statsContainer.appendChild(createStatItem('主要主題：', mainThemes));
    
    analysisContainer.appendChild(header);
    analysisContainer.appendChild(statsContainer);
    
    // 插入到preview area前面
    const existingAnalysis = document.querySelector('.content-analysis');
    if (existingAnalysis) {
        existingAnalysis.remove();
    }
    previewArea.parentNode.insertBefore(analysisContainer, previewArea);
}

function displaySlidePreview() {
    slideThumbnails.innerHTML = '';
    
    appState.generatedSlides.forEach((slide, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'slide-thumbnail';
        
        // 安全創建投影片預覽元素
        const slideNumber = createSafeElement('div', (index + 1).toString(), 'slide-thumbnail__number');
        const slideTitle = createSafeElement('div', escapeHtml(sanitizeUserInput(slide.title)), 'slide-thumbnail__title');
        const slideContent = createSafeElement('div', escapeHtml(sanitizeUserInput(slide.content)), 'slide-thumbnail__content');
        const slideType = createSafeElement('div', getSlideTypeLabel(slide.type), 'slide-thumbnail__type');
        
        // 安全處理要點信息
        if (slide.bullet_points && Array.isArray(slide.bullet_points)) {
            const bulletsDiv = document.createElement('div');
            bulletsDiv.className = 'slide-thumbnail__bullets';
            
            slide.bullet_points.slice(0, 3).forEach(point => {
                const bulletPoint = createSafeElement('div', `• ${escapeHtml(sanitizeUserInput(point))}`);
                bulletsDiv.appendChild(bulletPoint);
            });
            
            thumbnail.appendChild(slideNumber);
            thumbnail.appendChild(slideTitle);
            thumbnail.appendChild(slideContent);
            thumbnail.appendChild(bulletsDiv);
            thumbnail.appendChild(slideType);
        } else {
            thumbnail.appendChild(slideNumber);
            thumbnail.appendChild(slideTitle);
            thumbnail.appendChild(slideContent);
            thumbnail.appendChild(slideType);
        }
        
        thumbnail.addEventListener('click', () => {
            showSlideDetail(slide, index + 1);
        });
        
        slideThumbnails.appendChild(thumbnail);
    });

    previewControls.classList.remove('hidden');
    previewArea.scrollIntoView({ behavior: 'smooth' });
}

function displayAIInsights(result) {
    // 在預覽控制項後面添加AI洞察
    let insightsContainer = document.querySelector('.ai-insights');
    if (!insightsContainer) {
        insightsContainer = document.createElement('div');
        insightsContainer.className = 'ai-insights';
        previewControls.appendChild(insightsContainer);
    }
    
    const visualSuggestions = result.visual_suggestions;
    const metadata = result.generation_metadata;
    
    insightsContainer.innerHTML = `
        <div class="insights-header">
            <h4>🤖 AI設計建議</h4>
            <div class="quality-score">
                質量分數：<span class="score-value">${(metadata.quality_score * 100).toFixed(0)}%</span>
            </div>
        </div>
        <div class="insights-content">
            <div class="insight-section">
                <h5>🎨 建議色彩方案</h5>
                <div class="color-palette">
                    <div class="color-item" style="background-color: ${visualSuggestions.color_scheme.primary}">
                        <span>主色</span>
                    </div>
                    <div class="color-item" style="background-color: ${visualSuggestions.color_scheme.secondary}">
                        <span>輔色</span>
                    </div>
                    <div class="color-item" style="background-color: ${visualSuggestions.color_scheme.background}; border: 1px solid #ddd;">
                        <span>背景</span>
                    </div>
                </div>
            </div>
            <div class="insight-section">
                <h5>📝 字體建議</h5>
                <p>標題：${visualSuggestions.typography.title_font} | 內容：${visualSuggestions.typography.content_font}</p>
            </div>
            <div class="insight-section">
                <h5>💡 設計原則</h5>
                <ul class="design-principles">
                    ${visualSuggestions.design_principles.map(principle => `<li>${principle}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function getContentTypeLabel(type) {
    const labels = {
        'business': '商業簡報',
        'academic': '學術報告',
        'creative': '創意提案',
        'technical': '技術文檔',
        'general': '通用內容'
    };
    return labels[type] || '未知類型';
}

function getComplexityLabel(level) {
    const labels = {
        'simple': '簡單',
        'medium': '中等',
        'complex': '複雜'
    };
    return labels[level] || '未知';
}

function getSlideTypeLabel(type) {
    const labels = {
        'title': '標題頁',
        'content': '內容頁',
        'conclusion': '結論頁'
    };
    return labels[type] || '內容頁';
}

function showSlideDetail(slide, slideNumber) {
    const detail = `
        投影片 ${slideNumber}: ${slide.title}
        
        內容: ${slide.content}
        
        ${slide.bullet_points ? '要點:\n' + slide.bullet_points.map(point => `• ${point}`).join('\n') : ''}
        
        建議視覺元素: ${slide.visual_elements ? slide.visual_elements.join(', ') : '無'}
    `;
    
    showNotification(detail, 'info');
}

// Star rating system
function handleStarClick(e) {
    const rating = parseInt(e.target.dataset.rating);
    appState.currentRating = rating;
    updateStarDisplay(rating);
    updateRatingText(rating);
}

function handleStarHover(e) {
    const rating = parseInt(e.target.dataset.rating);
    updateStarDisplay(rating);
}

function resetStarHover() {
    updateStarDisplay(appState.currentRating);
}

function updateStarDisplay(rating) {
    const stars = starRating.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateRatingText(rating) {
    const ratingTexts = {
        1: '需要大幅改進',
        2: '有改進空間',
        3: '還不錯',
        4: '很好',
        5: '非常滿意'
    };
    ratingText.textContent = ratingTexts[rating] || '請點擊星星評分';
}

// Feedback submission with design learning
async function handleFeedbackSubmit() {
    const feedback = feedbackText.value.trim();
    const rating = appState.currentRating;

    if (rating === 0) {
        showNotification('請先為生成結果評分', 'warning');
        return;
    }

    if (!feedback) {
        showNotification('請提供您的反饋意見', 'warning');
        return;
    }

    if (!appState.currentPresentationId) {
        showNotification('找不到簡報ID，請重新生成', 'error');
        return;
    }

    try {
        // 提交基本反饋到後端
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                presentation_id: appState.currentPresentationId,
                rating: rating,
                feedback_text: feedback,
                improvement_suggestions: feedback
            })
        });

        const result = await response.json();

        if (result.success) {
            // 進行設計學習
            const userId = getUserId();
            await performDesignLearning(userId, appState.currentPresentationId, rating, feedback);
            
            showNotification('感謝您的反饋！AI 已學習您的偏好，下次將提供更個性化的建議', 'success');
            feedbackText.value = '';
            appState.currentRating = 0;
            updateStarDisplay(0);
            updateRatingText(0);
            
            // 更新個性化推薦顯示
            await updatePersonalizedRecommendations(userId);
        } else {
            showNotification(`反饋提交失敗：${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Feedback error:', error);
        showNotification('反饋提交過程中發生網路錯誤', 'error');
    }
}

// 獲取或生成用戶ID
function getUserId() {
    let userId = localStorage.getItem('ai_ppt_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('ai_ppt_user_id', userId);
    }
    return userId;
}

// 執行設計學習
async function performDesignLearning(userId, presentationId, rating, feedbackText) {
    try {
        const detailedFeedback = {
            overall_rating: rating,
            design_rating: rating,
            content_rating: rating,
            usability_rating: rating,
            comments: feedbackText,
            suggestions: feedbackText ? [feedbackText] : []
        };
        
        const learningResponse = await fetch('/api/learn-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                presentation_id: presentationId,
                feedback: detailedFeedback
            })
        });
        
        const learningResult = await learningResponse.json();
        
        if (learningResult.success) {
            console.log('設計學習完成:', learningResult.learning_result);
            
            // 更新用戶偏好顯示
            await updateUserProfile(userId);
        }
    } catch (error) {
        console.warn('設計學習失敗，但反饋已保存:', error);
    }
}

// 更新個性化推薦
async function updatePersonalizedRecommendations(userId, presentationType = 'business') {
    try {
        const response = await fetch(`/api/personalized-recommendations/${userId}?type=${presentationType}`);
        const result = await response.json();
        
        if (result.success) {
            displayPersonalizedRecommendations(result.recommendations);
        }
    } catch (error) {
        console.warn('獲取個性化推薦失敗:', error);
    }
}

// 顯示個性化推薦
function displayPersonalizedRecommendations(recommendations) {
    // 檢查是否有個性化推薦容器，如果沒有則創建
    let recommendationsContainer = document.getElementById('personalizedRecommendations');
    if (!recommendationsContainer) {
        recommendationsContainer = document.createElement('div');
        recommendationsContainer.id = 'personalizedRecommendations';
        recommendationsContainer.className = 'personalized-recommendations';
        
        // 插入到結果區域
        const resultContainer = document.querySelector('.result-container');
        if (resultContainer) {
            resultContainer.appendChild(recommendationsContainer);
        }
    }
    
    const personalizedContent = `
        <div class="personalized-panel">
            <h3>🎨 個性化設計建議</h3>
            <div class="personalization-level">
                <div class="level-indicator">
                    <span>個性化程度: </span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(recommendations.personalization_level * 100)}%"></div>
                    </div>
                    <span>${Math.round(recommendations.personalization_level * 100)}%</span>
                </div>
            </div>
            
            <div class="recommendations-grid">
                <div class="recommendation-card">
                    <h4>🎨 推薦色彩</h4>
                    <div class="color-preview">
                        <div class="color-swatch" style="background-color: ${recommendations.recommendations.color_scheme.primary}" title="主色調"></div>
                        <div class="color-swatch" style="background-color: ${recommendations.recommendations.color_scheme.secondary}" title="輔助色"></div>
                    </div>
                    <p>信心度: ${Math.round(recommendations.confidence_scores.overall * 100)}%</p>
                </div>
                
                <div class="recommendation-card">
                    <h4>📝 推薦字體</h4>
                    <p><strong>標題:</strong> ${recommendations.recommendations.typography.title_font}</p>
                    <p><strong>內文:</strong> ${recommendations.recommendations.typography.content_font}</p>
                </div>
                
                <div class="recommendation-card">
                    <h4>📐 推薦佈局</h4>
                    <p>${getLayoutDisplayName(recommendations.recommendations.layout_style)}</p>
                </div>
                
                <div class="recommendation-card">
                    <h4>⚙️ 複雜度偏好</h4>
                    <p>${getComplexityDisplayName(recommendations.recommendations.complexity_level)}</p>
                </div>
            </div>
            
            ${recommendations.adaptive_suggestions.length > 0 ? `
                <div class="adaptive-suggestions">
                    <h4>💡 適應性建議</h4>
                    <ul>
                        ${recommendations.adaptive_suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    recommendationsContainer.innerHTML = personalizedContent;
    recommendationsContainer.style.display = 'block';
}

// 更新用戶檔案
async function updateUserProfile(userId) {
    try {
        const response = await fetch(`/api/user-profile/${userId}`);
        const result = await response.json();
        
        if (result.success && result.profile.feedback_count > 0) {
            displayUserProfile(result.profile);
        }
    } catch (error) {
        console.warn('獲取用戶檔案失敗:', error);
    }
}

// 顯示用戶檔案
function displayUserProfile(profile) {
    let profileContainer = document.getElementById('userProfile');
    if (!profileContainer) {
        profileContainer = document.createElement('div');
        profileContainer.id = 'userProfile';
        profileContainer.className = 'user-profile';
        
        // 插入到設定區域
        const settingsArea = document.querySelector('.settings-container') || document.querySelector('.container');
        if (settingsArea) {
            settingsArea.appendChild(profileContainer);
        }
    }
    
    const profileContent = `
        <div class="user-profile-panel">
            <h3>👤 您的設計偏好檔案</h3>
            <div class="profile-stats">
                <div class="stat-item">
                    <span class="stat-label">反饋次數:</span>
                    <span class="stat-value">${profile.feedback_count}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">個性化程度:</span>
                    <span class="stat-value">${Math.round(profile.personalization_level * 100)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">推薦信心度:</span>
                    <span class="stat-value">${Math.round(profile.confidence_score * 100)}%</span>
                </div>
            </div>
        </div>
    `;
    
    profileContainer.innerHTML = profileContent;
    profileContainer.style.display = 'block';
}

// 智能圖表生成
async function generateSmartChart(chartData, chartType = null, stylePreferences = null) {
    try {
        const response = await fetch('/api/generate-chart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chart_data: chartData,
                chart_type: chartType,
                style_preferences: stylePreferences
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayGeneratedChart(result.chart);
            return result.chart;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('智能圖表生成失敗:', error);
        showNotification('圖表生成失敗：' + error.message, 'error');
        return null;
    }
}

// 智能圖標生成
async function generateSmartIcon(concept, style = 'modern', colorScheme = null) {
    try {
        const response = await fetch('/api/generate-icon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                concept: concept,
                style: style,
                color_scheme: colorScheme
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayGeneratedIcon(result.icon);
            return result.icon;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('智能圖標生成失敗:', error);
        showNotification('圖標生成失敗：' + error.message, 'error');
        return null;
    }
}

// 獲取圖表推薦
async function getChartRecommendations(dataSample) {
    try {
        const response = await fetch('/api/chart-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data_sample: dataSample
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayChartRecommendations(result);
            return result;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('圖表推薦獲取失敗:', error);
        return null;
    }
}

// 顯示生成的圖表
function displayGeneratedChart(chartResult) {
    let chartContainer = document.getElementById('generatedCharts');
    if (!chartContainer) {
        chartContainer = document.createElement('div');
        chartContainer.id = 'generatedCharts';
        chartContainer.className = 'generated-charts';
        
        // 插入到結果區域
        const resultContainer = document.querySelector('.result-container') || document.querySelector('.container');
        if (resultContainer) {
            resultContainer.appendChild(chartContainer);
        }
    }
    
    const chartElement = document.createElement('div');
    chartElement.className = 'chart-item';
    chartElement.innerHTML = `
        <div class="chart-header">
            <h4>📊 智能生成圖表</h4>
            <span class="chart-type-badge">${getChartTypeDisplayName(chartResult.chart_type)}</span>
        </div>
        <div class="chart-content">
            <img src="data:image/png;base64,${chartResult.chart_data.chart_base64}" 
                 alt="${chartResult.chart_type} 圖表" 
                 class="generated-chart-image">
        </div>
        <div class="chart-info">
            <p><strong>數據分析:</strong> ${chartResult.data_analysis ? JSON.stringify(chartResult.data_analysis) : '已完成'}</p>
            <div class="chart-suggestions">
                <h5>💡 優化建議:</h5>
                <ul>
                    ${chartResult.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>
        </div>
        <div class="chart-actions">
            <button class="btn btn--sm btn--outline" onclick="downloadChart('${chartResult.chart_data.chart_base64}', '${chartResult.chart_type}')">
                📥 下載圖表
            </button>
            <button class="btn btn--sm btn--secondary" onclick="regenerateChart()">
                🔄 重新生成
            </button>
        </div>
    `;
    
    chartContainer.appendChild(chartElement);
    chartContainer.style.display = 'block';
}

// 顯示生成的圖標
function displayGeneratedIcon(iconResult) {
    let iconContainer = document.getElementById('generatedIcons');
    if (!iconContainer) {
        iconContainer = document.createElement('div');
        iconContainer.id = 'generatedIcons';
        iconContainer.className = 'generated-icons';
        
        // 插入到結果區域
        const resultContainer = document.querySelector('.result-container') || document.querySelector('.container');
        if (resultContainer) {
            resultContainer.appendChild(iconContainer);
        }
    }
    
    const iconElement = document.createElement('div');
    iconElement.className = 'icon-item';
    iconElement.innerHTML = `
        <div class="icon-header">
            <h4>🎨 智能生成圖標</h4>
            <span class="icon-concept-badge">${iconResult.concept}</span>
        </div>
        <div class="icon-content">
            <img src="data:image/png;base64,${iconResult.icon_data.icon_base64}" 
                 alt="${iconResult.concept} 圖標" 
                 class="generated-icon-image">
        </div>
        <div class="icon-info">
            <p><strong>設計風格:</strong> ${iconResult.style}</p>
            <div class="color-scheme">
                <strong>色彩方案:</strong>
                <div class="color-swatches">
                    <div class="color-swatch" style="background-color: ${iconResult.color_scheme.primary}" title="主色調"></div>
                    <div class="color-swatch" style="background-color: ${iconResult.color_scheme.secondary}" title="輔助色"></div>
                </div>
            </div>
        </div>
        <div class="icon-variations">
            <h5>🔄 圖標變體:</h5>
            <div class="variations-list">
                ${iconResult.variations.slice(0, 3).map(variation => 
                    `<span class="variation-tag">${variation.size || variation.description}</span>`
                ).join('')}
            </div>
        </div>
        <div class="icon-actions">
            <button class="btn btn--sm btn--outline" onclick="downloadIcon('${iconResult.icon_data.icon_base64}', '${iconResult.concept}')">
                📥 下載圖標
            </button>
            <button class="btn btn--sm btn--secondary" onclick="generateIconVariations('${iconResult.concept}')">
                🎨 生成變體
            </button>
        </div>
    `;
    
    iconContainer.appendChild(iconElement);
    iconContainer.style.display = 'block';
}

// 顯示圖表推薦
function displayChartRecommendations(recommendations) {
    let recommendationsContainer = document.getElementById('chartRecommendations');
    if (!recommendationsContainer) {
        recommendationsContainer = document.createElement('div');
        recommendationsContainer.id = 'chartRecommendations';
        recommendationsContainer.className = 'chart-recommendations';
        
        // 插入到設定區域
        const settingsArea = document.querySelector('.settings-container') || document.querySelector('.container');
        if (settingsArea) {
            settingsArea.appendChild(recommendationsContainer);
        }
    }
    
    const recommendationsContent = `
        <div class="recommendations-panel">
            <h3>📊 智能圖表推薦</h3>
            
            <div class="data-analysis-summary">
                <h4>📈 數據分析結果</h4>
                <div class="analysis-stats">
                    <div class="stat-item">
                        <span class="stat-label">數據類型:</span>
                        <span class="stat-value">${getDataTypeDisplayName(recommendations.data_analysis.data_type)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">數據量:</span>
                        <span class="stat-value">${recommendations.data_analysis.data_size}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">複雜度:</span>
                        <span class="stat-value">${getComplexityDisplayName(recommendations.data_analysis.complexity_level)}</span>
                    </div>
                </div>
            </div>
            
            <div class="chart-recommendation">
                <h4>🎯 推薦圖表類型</h4>
                <div class="recommended-chart">
                    <span class="chart-type-main">${getChartTypeDisplayName(recommendations.recommended_chart_type)}</span>
                    <button class="btn btn--primary btn--sm" onclick="useRecommendedChart('${recommendations.recommended_chart_type}')">
                        使用推薦
                    </button>
                </div>
            </div>
            
            <div class="chart-suggestions">
                <h4>💡 專業建議</h4>
                <ul>
                    ${recommendations.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>
            
            ${recommendations.alternative_types.length > 0 ? `
                <div class="alternative-charts">
                    <h4>🔄 其他選項</h4>
                    <div class="chart-type-grid">
                        ${recommendations.alternative_types.map(type => 
                            `<button class="chart-type-option" onclick="useRecommendedChart('${type}')">
                                ${getChartTypeDisplayName(type)}
                            </button>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    recommendationsContainer.innerHTML = recommendationsContent;
    recommendationsContainer.style.display = 'block';
}

// 下載圖表
function downloadChart(chartBase64, chartType) {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${chartBase64}`;
    link.download = `chart_${chartType}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('圖表下載完成！', 'success');
}

// 下載圖標
function downloadIcon(iconBase64, concept) {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${iconBase64}`;
    link.download = `icon_${concept}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('圖標下載完成！', 'success');
}

// 使用推薦的圖表類型
function useRecommendedChart(chartType) {
    // 這裡可以觸發使用推薦圖表類型的邏輯
    showNotification(`已選擇 ${getChartTypeDisplayName(chartType)} 圖表類型`, 'success');
    
    // 可以在這裡添加自動填充表單或其他邏輯
    const chartTypeInput = document.getElementById('chartType');
    if (chartTypeInput) {
        chartTypeInput.value = chartType;
    }
}

// 生成圖標變體
async function generateIconVariations(concept) {
    const variations = ['minimal', 'detailed', 'colorful'];
    
    for (const style of variations) {
        await generateSmartIcon(concept, style);
    }
    
    showNotification('圖標變體生成完成！', 'success');
}

// 處理圖表生成
async function handleChartGeneration() {
    const chartDataInput = document.getElementById('chartDataInput');
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const chartColorScheme = document.getElementById('chartColorScheme');
    
    if (!chartDataInput.value.trim()) {
        showNotification('請輸入圖表數據', 'error');
        return;
    }
    
    try {
        // 解析JSON數據
        const chartData = JSON.parse(chartDataInput.value);
        
        // 構建樣式偏好
        const stylePreferences = {
            primary_color: getColorSchemeColors(chartColorScheme.value).primary,
            colors: getColorSchemeColors(chartColorScheme.value).palette,
            colormap: chartColorScheme.value === 'monochrome' ? 'gray' : 'viridis'
        };
        
        // 顯示載入狀態
        showNotification('正在生成智能圖表...', 'info');
        
        // 生成圖表
        const result = await generateSmartChart(
            chartData, 
            chartTypeSelect.value || null,
            stylePreferences
        );
        
        if (result) {
            showNotification('圖表生成成功！', 'success');
        }
        
    } catch (error) {
        console.error('Chart generation error:', error);
        showNotification('圖表數據格式錯誤，請檢查JSON格式', 'error');
    }
}

// 處理圖標生成
async function handleIconGeneration() {
    const iconConceptInput = document.getElementById('iconConceptInput');
    const iconStyleSelect = document.getElementById('iconStyleSelect');
    
    if (!iconConceptInput.value.trim()) {
        showNotification('請輸入圖標概念', 'error');
        return;
    }
    
    // 顯示載入狀態
    showNotification('正在生成智能圖標...', 'info');
    
    // 生成圖標
    const result = await generateSmartIcon(
        iconConceptInput.value,
        iconStyleSelect.value
    );
    
    if (result) {
        showNotification('圖標生成成功！', 'success');
    }
}

// 從輸入獲取圖表推薦
async function getChartRecommendationsFromInput() {
    const chartDataInput = document.getElementById('chartDataInput');
    
    if (!chartDataInput.value.trim()) {
        showNotification('請輸入圖表數據以獲取推薦', 'error');
        return;
    }
    
    try {
        const chartData = JSON.parse(chartDataInput.value);
        
        showNotification('正在分析數據並生成推薦...', 'info');
        
        const result = await getChartRecommendations(chartData);
        
        if (result) {
            showNotification('圖表推薦生成成功！', 'success');
        }
        
    } catch (error) {
        console.error('Chart recommendations error:', error);
        showNotification('數據格式錯誤，請檢查JSON格式', 'error');
    }
}

// 生成圖標集
async function generateIconSet() {
    const iconConceptInput = document.getElementById('iconConceptInput');
    
    if (!iconConceptInput.value.trim()) {
        showNotification('請輸入圖標概念', 'error');
        return;
    }
    
    const styles = ['modern', 'minimal', 'detailed'];
    const concept = iconConceptInput.value;
    
    showNotification('正在生成圖標集合...', 'info');
    
    for (const style of styles) {
        await generateSmartIcon(concept, style);
    }
    
    showNotification('圖標集生成完成！', 'success');
}

// 載入圖表示例
function loadChartExample(type) {
    const chartDataInput = document.getElementById('chartDataInput');
    
    let exampleData;
    switch (type) {
        case 'sales':
            exampleData = {
                "values": [120, 150, 180, 220, 190, 250],
                "labels": ["1月", "2月", "3月", "4月", "5月", "6月"],
                "title": "2024年月度銷售額",
                "x_label": "月份",
                "y_label": "銷售額 (萬元)"
            };
            break;
        case 'survey':
            exampleData = {
                "values": [45, 30, 15, 10],
                "labels": ["非常滿意", "滿意", "普通", "不滿意"],
                "title": "客戶滿意度調查結果"
            };
            break;
        default:
            exampleData = {
                "values": [10, 20, 30, 40],
                "labels": ["A", "B", "C", "D"],
                "title": "範例圖表"
            };
    }
    
    chartDataInput.value = JSON.stringify(exampleData, null, 2);
    showNotification(`已載入${type === 'sales' ? '銷售數據' : '調查結果'}範例`, 'success');
}

// 載入圖標示例
function loadIconExample(type) {
    const iconConceptInput = document.getElementById('iconConceptInput');
    
    let concept;
    switch (type) {
        case 'business':
            concept = '商業';
            break;
        case 'tech':
            concept = '科技';
            break;
        default:
            concept = '通用';
    }
    
    iconConceptInput.value = concept;
    showNotification(`已載入${concept}圖標概念`, 'success');
}

// 獲取色彩方案顏色
function getColorSchemeColors(scheme) {
    const schemes = {
        'professional': {
            primary: '#1f77b4',
            palette: ['#1f77b4', '#2f4f8f', '#708090', '#b0c4de']
        },
        'vibrant': {
            primary: '#ff6b6b',
            palette: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
        },
        'warm': {
            primary: '#ff9a56',
            palette: ['#ff9a56', '#ffad56', '#ffc056', '#ffd356']
        },
        'cool': {
            primary: '#4a90e2',
            palette: ['#4a90e2', '#7ed321', '#50e3c2', '#b8e986']
        },
        'monochrome': {
            primary: '#2c3e50',
            palette: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6']
        }
    };
    
    return schemes[scheme] || schemes['professional'];
}

// 輔助函數
function getLayoutDisplayName(layout) {
    const layoutNames = {
        'professional_grid': '專業網格',
        'academic_structured': '學術結構',
        'creative_flexible': '創意靈活',
        'title_slide': '標題投影片',
        'title_and_content': '標題與內容'
    };
    return layoutNames[layout] || layout;
}

function getComplexityDisplayName(complexity) {
    const complexityNames = {
        'low': '簡單',
        'medium': '中等',
        'high': '複雜'
    };
    return complexityNames[complexity] || complexity;
}

function getChartTypeDisplayName(chartType) {
    const chartTypeNames = {
        'bar': '柱狀圖',
        'line': '折線圖',
        'pie': '餅圖',
        'scatter': '散點圖',
        'area': '面積圖',
        'histogram': '直方圖',
        'heatmap': '熱力圖',
        'box': '箱線圖'
    };
    return chartTypeNames[chartType] || chartType;
}

function getDataTypeDisplayName(dataType) {
    const dataTypeNames = {
        'numerical': '數值型',
        'categorical': '類別型',
        'structured': '結構化',
        'time_series': '時間序列',
        'unknown': '未知'
    };
    return dataTypeNames[dataType] || dataType;
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            <span class="notification__message">${message}</span>
            <button class="notification__close">&times;</button>
        </div>
    `;

    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    `;

    // Set colors based on type
    const colors = {
        success: { bg: 'rgba(33, 128, 141, 0.1)', border: 'var(--color-success)', text: 'var(--color-success)' },
        error: { bg: 'rgba(192, 21, 47, 0.1)', border: 'var(--color-error)', text: 'var(--color-error)' },
        warning: { bg: 'rgba(168, 75, 47, 0.1)', border: 'var(--color-warning)', text: 'var(--color-warning)' },
        info: { bg: 'rgba(98, 108, 113, 0.1)', border: 'var(--color-info)', text: 'var(--color-info)' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.border = `1px solid ${color.border}`;
    notification.style.color = color.text;

    const content = notification.querySelector('.notification__content');
    content.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

    const closeBtn = notification.querySelector('.notification__close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
        margin-left: 12px;
    `;

    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    });

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize demo data on page load
window.addEventListener('load', function() {
    // Show welcome message
    setTimeout(() => {
        showNotification('歡迎使用 AI PPT 製作器！上傳您的模板開始使用', 'info');
    }, 1000);
});

// ==================== 批量處理功能 ====================

let batchFiles = [];
let activeJobs = new Map();

// 打開批量處理面板
function openBatchPanel() {
    const panel = document.getElementById('batchProcessingPanel');
    if (panel) {
        panel.style.display = 'flex';
        // 初始化面板
        initializeBatchPanel();
        refreshJobs();
        refreshMetrics();
    }
}

// 關閉批量處理面板
function closeBatchPanel() {
    const panel = document.getElementById('batchProcessingPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// 初始化批量處理面板
function initializeBatchPanel() {
    // 設置文件輸入事件
    const fileInput = document.getElementById('batchFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleBatchFileSelect);
    }
    
    // 設置提交按鈕事件
    const submitBtn = document.getElementById('submitBatchJob');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitBatchJob);
    }
    
    // 設置標籤切換事件
    const tabs = document.querySelectorAll('.batch-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchBatchTab(e.target.dataset.tab);
        });
    });
    
    // 清空文件列表
    batchFiles = [];
    updateBatchFileList();
}

// 切換批量處理標籤
function switchBatchTab(tabName) {
    // 更新標籤狀態
    document.querySelectorAll('.batch-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 更新內容區域
    document.querySelectorAll('.batch-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // 根據標籤載入相應內容
    if (tabName === 'batch-jobs') {
        refreshJobs();
    } else if (tabName === 'batch-monitor') {
        refreshMetrics();
    }
}

// 選擇批量文件
function selectBatchFiles() {
    const fileInput = document.getElementById('batchFileInput');
    if (fileInput) {
        fileInput.click();
    }
}

// 處理文件選擇
function handleBatchFileSelect(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        if (file.type.includes('presentation') || 
            file.name.endsWith('.ppt') || 
            file.name.endsWith('.pptx')) {
            
            // 檢查是否已存在
            if (!batchFiles.some(f => f.name === file.name && f.size === file.size)) {
                batchFiles.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    id: Date.now() + Math.random()
                });
            }
        } else {
            showNotification(`文件 ${file.name} 不是有效的PPT格式`, 'warning');
        }
    });
    
    updateBatchFileList();
}

// 處理拖拽上傳
function allowBatchDrop(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    
    const dropZone = event.target.closest('.batch-drop-zone');
    if (dropZone) {
        dropZone.classList.add('dragover');
    }
}

function handleBatchDrop(event) {
    event.preventDefault();
    
    const dropZone = event.target.closest('.batch-drop-zone');
    if (dropZone) {
        dropZone.classList.remove('dragover');
    }
    
    const files = Array.from(event.dataTransfer.files);
    
    files.forEach(file => {
        if (file.type.includes('presentation') || 
            file.name.endsWith('.ppt') || 
            file.name.endsWith('.pptx')) {
            
            if (!batchFiles.some(f => f.name === file.name && f.size === file.size)) {
                batchFiles.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    id: Date.now() + Math.random()
                });
            }
        } else {
            showNotification(`文件 ${file.name} 不是有效的PPT格式`, 'warning');
        }
    });
    
    updateBatchFileList();
}

// 更新批量文件列表顯示
function updateBatchFileList() {
    const fileListContainer = document.getElementById('batchFileList');
    const filesContainer = document.getElementById('batchFiles');
    const submitBtn = document.getElementById('submitBatchJob');
    
    if (batchFiles.length === 0) {
        fileListContainer.style.display = 'none';
        submitBtn.disabled = true;
        return;
    }
    
    fileListContainer.style.display = 'block';
    submitBtn.disabled = false;
    
    filesContainer.innerHTML = batchFiles.map(fileData => `
        <div class="batch-file-item">
            <div class="file-info">
                <div class="file-icon">📄</div>
                <div class="file-details">
                    <div class="file-name">${fileData.name}</div>
                    <div class="file-size">${formatFileSize(fileData.size)}</div>
                </div>
            </div>
            <button class="remove-file" onclick="removeBatchFile('${fileData.id}')">×</button>
        </div>
    `).join('');
}

// 移除批量文件
function removeBatchFile(fileId) {
    batchFiles = batchFiles.filter(f => f.id !== fileId);
    updateBatchFileList();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 提交批量任務
async function submitBatchJob() {
    try {
        if (batchFiles.length === 0) {
            showNotification('請先選擇要處理的文件', 'warning');
            return;
        }
        
        const jobType = document.getElementById('batchJobType').value;
        const priority = document.getElementById('batchPriority').value;
        
        showNotification('正在提交批量任務...', 'info');
        
        // 模擬上傳文件並獲取文件路徑
        const filePaths = batchFiles.map(fileData => 
            `uploads/${Date.now()}_${fileData.name}`
        );
        
        const response = await fetch('/api/batch/create-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: filePaths,
                job_type: jobType,
                parameters: {
                    priority: priority,
                    user_id: 'current_user',
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`批量任務已提交！工作ID: ${result.job_id}`, 'success');
            
            // 清空文件列表
            batchFiles = [];
            updateBatchFileList();
            
            // 切換到工作管理標籤
            switchBatchTab('batch-jobs');
            
            // 啟動處理隊列
            startBatchProcessing();
            
        } else {
            showNotification(`提交失敗: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Batch job submission error:', error);
        showNotification('提交批量任務失敗：' + error.message, 'error');
    }
}

// 啟動批量處理
async function startBatchProcessing() {
    try {
        const response = await fetch('/api/batch/process-queue', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('批量處理已啟動');
        }
        
    } catch (error) {
        console.error('Start batch processing error:', error);
    }
}

// 刷新工作列表
async function refreshJobs() {
    try {
        const jobsList = document.getElementById('jobsList');
        if (!jobsList) return;
        
        // 這裡應該從服務器獲取真實的工作列表
        // 暫時顯示模擬數據
        const jobs = Array.from(activeJobs.values());
        
        if (jobs.length === 0) {
            jobsList.innerHTML = '<div class="no-jobs">暫無批量工作</div>';
            return;
        }
        
        jobsList.innerHTML = jobs.map(job => createJobItemHTML(job)).join('');
        
    } catch (error) {
        console.error('Refresh jobs error:', error);
    }
}

// 創建工作項目HTML
function createJobItemHTML(job) {
    const progressPercent = Math.round(job.progress * 100);
    
    return `
        <div class="job-item">
            <div class="job-header">
                <div class="job-id">${job.job_id}</div>
                <div class="job-status ${job.status}">${getStatusText(job.status)}</div>
            </div>
            
            <div class="job-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="progress-text">${progressPercent}% 完成</div>
            </div>
            
            <div class="job-details">
                <div class="job-detail">
                    <div class="job-detail-label">工作類型</div>
                    <div class="job-detail-value">${getJobTypeText(job.job_type)}</div>
                </div>
                <div class="job-detail">
                    <div class="job-detail-label">總任務數</div>
                    <div class="job-detail-value">${job.total_tasks}</div>
                </div>
                <div class="job-detail">
                    <div class="job-detail-label">已完成</div>
                    <div class="job-detail-value">${job.completed_tasks}</div>
                </div>
                <div class="job-detail">
                    <div class="job-detail-label">失敗</div>
                    <div class="job-detail-value">${job.failed_tasks}</div>
                </div>
                <div class="job-detail">
                    <div class="job-detail-label">創建時間</div>
                    <div class="job-detail-value">${formatDateTime(job.created_at)}</div>
                </div>
            </div>
        </div>
    `;
}

// 獲取狀態文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待處理',
        'processing': '處理中',
        'completed': '已完成',
        'failed': '失敗',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 獲取工作類型文本
function getJobTypeText(jobType) {
    const typeMap = {
        'analyze': '分析模板',
        'generate': '生成簡報',
        'enhance': '增強文件'
    };
    return typeMap[jobType] || jobType;
}

// 格式化日期時間
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW');
}

// 刷新性能指標
async function refreshMetrics() {
    try {
        await Promise.all([
            updateAPIMetrics(),
            updateBatchStats(),
            updateCacheStats(),
            updateSystemStats()
        ]);
        
    } catch (error) {
        console.error('Refresh metrics error:', error);
    }
}

// 更新API性能指標
async function updateAPIMetrics() {
    try {
        const response = await fetch('/api/performance/metrics');
        const result = await response.json();
        
        const metricsContainer = document.getElementById('apiMetrics');
        if (metricsContainer && result.success) {
            const global = result.metrics.global || {};
            
            metricsContainer.innerHTML = `
                <div class="metric-item">
                    <span class="metric-label">總請求數</span>
                    <span class="metric-value">${global.total_requests || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">平均響應時間</span>
                    <span class="metric-value">${(global.average_response_time || 0).toFixed(2)}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">錯誤率</span>
                    <span class="metric-value ${getMetricClass(global.error_rate)}">${(global.error_rate * 100 || 0).toFixed(2)}%</span>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Update API metrics error:', error);
        const metricsContainer = document.getElementById('apiMetrics');
        if (metricsContainer) {
            metricsContainer.innerHTML = '<div class="metric-item">載入失敗</div>';
        }
    }
}

// 更新批量處理統計
async function updateBatchStats() {
    try {
        const response = await fetch('/api/performance/batch-stats');
        const result = await response.json();
        
        const statsContainer = document.getElementById('batchStats');
        if (statsContainer && result.success) {
            const stats = result.stats || {};
            
            statsContainer.innerHTML = `
                <div class="metric-item">
                    <span class="metric-label">已處理任務</span>
                    <span class="metric-value">${stats.total_processed || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">失敗任務</span>
                    <span class="metric-value">${stats.total_failed || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">平均處理時間</span>
                    <span class="metric-value">${(stats.average_processing_time || 0).toFixed(2)}秒</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">緩存命中率</span>
                    <span class="metric-value ${getMetricClass(stats.cache_hit_rate, true)}">${(stats.cache_hit_rate * 100 || 0).toFixed(2)}%</span>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Update batch stats error:', error);
        const statsContainer = document.getElementById('batchStats');
        if (statsContainer) {
            statsContainer.innerHTML = '<div class="metric-item">載入失敗</div>';
        }
    }
}

// 更新緩存統計
async function updateCacheStats() {
    const cacheContainer = document.getElementById('cacheStats');
    if (cacheContainer) {
        // 模擬緩存統計數據
        cacheContainer.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">緩存項目</span>
                <span class="metric-value">124</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">緩存大小</span>
                <span class="metric-value">2.3 MB</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">命中率</span>
                <span class="metric-value good">89.5%</span>
            </div>
        `;
    }
}

// 更新系統統計
async function updateSystemStats() {
    const systemContainer = document.getElementById('systemStats');
    if (systemContainer) {
        // 模擬系統統計數據
        systemContainer.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">CPU使用率</span>
                <span class="metric-value warning">45.2%</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">內存使用</span>
                <span class="metric-value">128 MB</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">系統運行時間</span>
                <span class="metric-value">2天 14小時</span>
            </div>
        `;
    }
}

// 獲取指標樣式類
function getMetricClass(value, reverse = false) {
    if (typeof value !== 'number') return '';
    
    if (reverse) {
        // 對於緩存命中率等指標，高值是好的
        if (value >= 0.8) return 'good';
        if (value >= 0.6) return 'warning';
        return 'danger';
    } else {
        // 對於錯誤率等指標，低值是好的
        if (value <= 0.05) return 'good';
        if (value <= 0.1) return 'warning';
        return 'danger';
    }
}

// 顯示性能監控
function showPerformanceMetrics() {
    openBatchPanel();
    switchBatchTab('batch-monitor');
}

// 清理緩存
async function clearCache() {
    try {
        if (!confirm('確定要清理所有緩存嗎？這可能會影響系統性能。')) {
            return;
        }
        
        showNotification('正在清理緩存...', 'info');
        
        const response = await fetch('/api/performance/cache/invalidate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`緩存清理完成，清理了 ${result.invalidated_count} 個項目`, 'success');
            refreshMetrics();
        } else {
            showNotification('緩存清理失敗：' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Clear cache error:', error);
        showNotification('清理緩存失敗：' + error.message, 'error');
    }
}

// 下載性能報告
async function downloadMetrics() {
    try {
        showNotification('正在生成性能報告...', 'info');
        
        const response = await fetch('/api/performance/metrics');
        const result = await response.json();
        
        if (result.success) {
            const reportData = {
                generated_at: new Date().toISOString(),
                metrics: result.metrics,
                timestamp: result.timestamp
            };
            
            const blob = new Blob([JSON.stringify(reportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance_report_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('性能報告下載完成', 'success');
        } else {
            showNotification('生成報告失敗：' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Download metrics error:', error);
        showNotification('下載報告失敗：' + error.message, 'error');
    }
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processFiles,
        generateSlides,
        updateSlideCountDisplay,
        handleStarClick
    };
}