/**
 * 应用主逻辑
 * 串联上传、检测、选项、生成、下载整个流程
 */

(function () {
  // DOM 元素
  const els = {
    fileInput: document.getElementById('fileInput'),
    dropZone: document.getElementById('dropZone'),
    selectBtn: document.getElementById('selectBtn'),
    cameraBtn: document.getElementById('cameraBtn'),
    cameraPreview: document.getElementById('cameraPreview'),
    captureCanvas: document.getElementById('captureCanvas'),
    cameraOverlay: document.getElementById('cameraOverlay'),
    cameraOverlayVideo: document.getElementById('cameraOverlayVideo'),
    cameraShutterBtn: document.getElementById('cameraShutterBtn'),
    cancelCameraBtn: document.getElementById('cancelCameraBtn'),
    uploadSection: document.getElementById('uploadSection'),
    sourceImage: document.getElementById('sourceImage'),
    sourceVideo: document.getElementById('sourceVideo'),
    faceOverlay: document.getElementById('faceOverlay'),
    statusBar: document.getElementById('statusBar'),
    statusText: document.getElementById('statusText'),
    detectInfo: document.getElementById('detectInfo'),
    faceCount: document.getElementById('faceCount'),
    expressionBadge: document.getElementById('expressionBadge'),
    errorBox: document.getElementById('errorBox'),
    styleGrid: document.getElementById('styleGrid'),
    captionEdit: document.getElementById('captionEdit'),
    captionInput: document.getElementById('captionInput'),
    autoCaptionBtn: document.getElementById('autoCaptionBtn'),
    generateBtn: document.getElementById('generateBtn'),
    resultImage: document.getElementById('resultImage'),
    resultGif: document.getElementById('resultGif'),
    gifProgress: document.getElementById('gifProgress'),
    gifProgressBar: document.getElementById('gifProgressBar'),
    gifProgressText: document.getElementById('gifProgressText'),
    downloadBtn: document.getElementById('downloadBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    backBtn: document.getElementById('backBtn'),
    resultTabs: document.querySelectorAll('.tab-btn'),
    showcaseSection: document.getElementById('showcaseSection'),
    showcaseScroll: document.getElementById('showcaseScroll'),
    showcaseCount: document.getElementById('showcaseCount'),
    // 向导步骤元素
    wizardProgress: document.getElementById('wizardProgress'),
    wizardStep1: document.getElementById('wizardStep1'),
    wizardStep2: document.getElementById('wizardStep2'),
    wizardStep3: document.getElementById('wizardStep3'),
    backToUploadBtn: document.getElementById('backToUploadBtn'),
    continueToEditBtn: document.getElementById('continueToEditBtn'),
    backToDetectBtn: document.getElementById('backToDetectBtn'),
    backToEditBtn: document.getElementById('backToEditBtn')
  };

  // 状态
  const state = {
    sourceUrl: null,
    sourceType: null, // 'image' | 'video'
    currentImage: null, // 当前用于生成的 Image 对象
    expression: 'neutral',
    expressionLabel: '平静',
    faceBoxes: [],
    selectedStyle: null,
    customCaption: '',
    resultType: 'static', // 'static' | 'animated'
    staticResult: null,
    animatedResult: null,
    seed: 0,
    isGenerating: false,
    currentStep: 0, // 0=首页, 1=识别, 2=编辑, 3=结果
    totalCount: 1123, // 默认基础数量
    globalCounter: null // Supabase 全局计数器
  };

  // 初始化
  async function init() {
    // 初始状态：隐藏向导，显示首页
    els.wizardProgress.hidden = true;
    els.wizardStep1.hidden = true;
    els.wizardStep2.hidden = true;
    els.wizardStep3.hidden = true;

    bindEvents();
    renderStyleOptions();

    // 初始化 Supabase 后端
    SupabaseBackend.init();

    // 渲染展示区（先渲染本地缓存，再异步拉取全网数据）
    renderShowcase();
    loadGlobalShowcase();

    // 检查是否由 Web Share Target 进入
    checkSharedFile();

    updateStatus('正在加载 AI 模型，请稍候…', true);
    try {
      await ExpressionModule.loadModels();
      updateStatus('AI 模型加载完成，请上传图片/视频', false);
    } catch (err) {
      console.warn('模型加载失败，用户仍可手动选择风格:', err);
      updateStatus('AI 模型加载失败，你仍可上传照片并手动选择风格', false);
    }

    // 静默拉取热梗
    loadHotTopicsSilently();
  }

  // 处理从安卓相册等应用分享过来的文件
  async function checkSharedFile() {
    const params = new URLSearchParams(location.search);
    if (params.get('share-target') !== 'pending') return;

    try {
      updateStatus('正在接收分享的文件…', true);
      const file = await getSharedFileFromSW();
      if (file) {
        handleFile(file);
      } else {
        showError('未能读取到分享的文件，请尝试从相册直接选择。');
      }
    } catch (err) {
      console.error(err);
      showError('读取分享文件失败：' + (err.message || '未知错误'));
    } finally {
      // 清除 URL 标记，避免刷新后重复处理
      if (history.replaceState) {
        history.replaceState({}, document.title, location.pathname);
      }
    }
  }

  function getSharedFileFromSW() {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        resolve(null);
        return;
      }
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data ? event.data.file : null);
      };
      navigator.serviceWorker.controller.postMessage({ type: 'GET_SHARED_FILE' }, [channel.port2]);
      // 兜底：3 秒无响应视为无文件
      setTimeout(() => resolve(null), 3000);
    });
  }

  // 静默拉取热梗，不显示任何 UI
  async function loadHotTopicsSilently() {
    try {
      await MemeEngine.loadHotTopics('./hot-topics.json', 60 * 24); // 缓存 1 天
    } catch (err) {
      console.warn('热梗加载失败:', err);
    }
  }

  function bindEvents() {
    // 上传
    els.selectBtn.addEventListener('click', () => els.fileInput.click());
    els.dropZone.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // 拖拽
    els.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.dropZone.classList.add('dragover');
    });
    els.dropZone.addEventListener('dragleave', () => {
      els.dropZone.classList.remove('dragover');
    });
    els.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      els.dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    // 拍照
    els.cameraBtn.addEventListener('click', openCameraOverlay);
    els.cameraShutterBtn.addEventListener('click', captureFromCamera);
    els.cancelCameraBtn.addEventListener('click', closeCameraOverlay);

    // 向导导航按钮
    els.backToUploadBtn.addEventListener('click', () => goToStep(0));
    els.continueToEditBtn.addEventListener('click', () => goToStep(2));
    els.backToDetectBtn.addEventListener('click', () => goToStep(1));
    els.backToEditBtn.addEventListener('click', () => goToStep(2));

    // 结果页签
    els.resultTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (state.isGenerating) return;
        els.resultTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.resultType = tab.dataset.type;
        showResult();
      });
    });

    // 文案编辑
    els.autoCaptionBtn.addEventListener('click', () => {
      state.seed++;
      const suggested = MemeEngine.getCaption(state.expression, state.selectedStyle?.id, state.seed, MemeEngine.getHotTopics(), state.expressionLabel);
      els.captionInput.value = suggested;
      state.customCaption = suggested;
    });
    els.generateBtn.addEventListener('click', () => {
      state.customCaption = els.captionInput.value.trim();
      generateForSelectedStyle();
    });
    els.captionInput.addEventListener('input', () => {
      state.customCaption = els.captionInput.value.trim();
    });

    // 操作按钮
    els.downloadBtn.addEventListener('click', downloadResult);
    els.regenerateBtn.addEventListener('click', () => {
      state.seed++;
      if (!state.customCaption) {
        const suggested = MemeEngine.getCaption(state.expression, state.selectedStyle?.id, state.seed, MemeEngine.getHotTopics(), state.expressionLabel);
        els.captionInput.value = suggested;
      }
      generateForSelectedStyle();
    });
    els.backBtn.addEventListener('click', () => goToStep(0));
  }

  function renderStyleOptions() {
    const styles = MemeEngine.getStyleOptions();
    els.styleGrid.innerHTML = styles.map(s => `
      <div class="style-item" data-style="${s.id}">
        <div class="style-emoji">${s.emoji}</div>
        <div class="style-name">${s.name}</div>
        <div class="style-desc">${s.desc}</div>
      </div>
    `).join('');

    els.styleGrid.querySelectorAll('.style-item').forEach(item => {
      item.addEventListener('click', () => {
        if (state.isGenerating) return;
        els.styleGrid.querySelectorAll('.style-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.selectedStyle = styles.find(s => s.id === item.dataset.style);
        state.seed = 0;
        showSection(els.captionEdit);

        // 生成推荐文案
        const suggested = MemeEngine.getCaption(state.expression, state.selectedStyle.id, state.seed, MemeEngine.getHotTopics(), state.expressionLabel);
        els.captionInput.value = suggested;
        state.customCaption = '';

        els.captionEdit.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  // 向导步骤管理
  function goToStep(step) {
    state.currentStep = step;

    // 首页：显示上传区和展示区，隐藏向导
    if (step === 0) {
      els.uploadSection.hidden = false;
      if (els.showcaseSection) els.showcaseSection.hidden = false;
      els.wizardProgress.hidden = true;
      els.wizardStep1.hidden = true;
      els.wizardStep2.hidden = true;
      els.wizardStep3.hidden = true;
      hideSection(els.captionEdit);
      els.fileInput.value = '';
      updateStatus('AI 模型加载完成，请上传图片/视频', false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 向导步骤：隐藏首页元素
    els.uploadSection.hidden = true;
    if (els.showcaseSection) els.showcaseSection.hidden = true;
    els.wizardProgress.hidden = false;

    // 隐藏所有步骤
    els.wizardStep1.hidden = true;
    els.wizardStep2.hidden = true;
    els.wizardStep3.hidden = true;

    // 显示目标步骤
    const targetEl = [null, els.wizardStep1, els.wizardStep2, els.wizardStep3][step];
    if (targetEl) targetEl.hidden = false;

    // 更新进度条
    updateProgressIndicator(step);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgressIndicator(step) {
    const steps = els.wizardProgress.querySelectorAll('.wp-step');
    steps.forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'done');
      if (s === step) el.classList.add('active');
      else if (s < step) el.classList.add('done');
    });
  }

  // 处理文件
  async function handleFile(file) {
    if (!file) return;

    resetState(false);
    hideError();

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    state.sourceType = type;
    state.sourceUrl = URL.createObjectURL(file);

    // 进入步骤 1：预览与检测
    goToStep(1);
    updateStatus('正在读取素材…', true);

    try {
      if (type === 'image') {
        els.sourceImage.src = state.sourceUrl;
        els.sourceImage.hidden = false;
        els.sourceVideo.hidden = true;
        els.sourceVideo.pause();
        els.sourceVideo.src = '';

        await waitForImage(els.sourceImage);
        state.currentImage = els.sourceImage;
      } else {
        els.sourceVideo.src = state.sourceUrl;
        els.sourceVideo.hidden = false;
        els.sourceImage.hidden = true;
        els.sourceImage.src = '';

        await waitForVideoMetadata(els.sourceVideo);
        // 取视频中间帧做人脸检测
        const midTime = els.sourceVideo.duration ? els.sourceVideo.duration / 2 : 0;
        els.sourceVideo.currentTime = midTime;
        await waitForVideoSeek(els.sourceVideo);
        const frameImg = await MemeEngine.getVideoFrame(els.sourceVideo, midTime);
        state.currentImage = frameImg;
      }

      await detectAndRender();
    } catch (err) {
      console.error(err);
      updateStatus('读取失败', false);
      showError('无法读取该文件：' + (err.message || '格式不支持'));
    }
  }

  // 相机拍照（全屏覆盖层）
  let cameraStream = null;
  async function openCameraOverlay() {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      els.cameraOverlayVideo.srcObject = cameraStream;
      els.cameraOverlay.hidden = false;
      document.body.style.overflow = 'hidden';
    } catch (err) {
      showError('无法调用摄像头：' + (err.message || '请检查权限'));
    }
  }

  function closeCameraOverlay() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    els.cameraOverlayVideo.srcObject = null;
    els.cameraOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  function captureFromCamera() {
    if (!cameraStream) return;
    const video = els.cameraOverlayVideo;
    const canvas = els.captureCanvas;
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      closeCameraOverlay();
      const file = new File([blob], 'camera-shot.jpg', { type: 'image/jpeg' });
      handleFile(file);
    }, 'image/jpeg', 0.92);
  }

  // 检测人脸并渲染（检测失败不阻塞流程）
  async function detectAndRender() {
    updateStatus('正在识别人脸与表情…', true);
    hideError();

    try {
      const result = await ExpressionModule.detect(state.currentImage);
      drawFaceOverlay(result.faces);

      if (result.faces.length === 0) {
        state.expression = 'neutral';
        state.expressionLabel = '平静';
        state.faceBoxes = [];

        els.faceCount.textContent = '未检测到人脸';
        els.expressionBadge.textContent = '表情：自动选择「平静」😊';
        showSection(els.detectInfo);

        updateStatus('未检测到人脸，你仍可手动选择风格继续生成', false);
      } else {
        state.expression = result.dominant;
        state.expressionLabel = ExpressionModule.getExpressionLabel(result.dominant);
        state.faceBoxes = result.faces.map(f => f.box);

        els.faceCount.textContent = `检测到 ${result.faces.length} 张人脸`;
        els.expressionBadge.textContent = `表情：${state.expressionLabel} ${ExpressionModule.getExpressionEmoji(state.expression)}`;
        showSection(els.detectInfo);

        updateStatus('识别完成，点击「继续选择风格」进入下一步', false);
      }
    } catch (err) {
      console.warn('人脸检测出错，使用默认表情继续:', err);
      state.expression = 'neutral';
      state.expressionLabel = '平静';
      state.faceBoxes = [];

      els.faceCount.textContent = '检测异常';
      els.expressionBadge.textContent = '表情：自动选择「平静」😊';
      showSection(els.detectInfo);

      updateStatus('表情识别异常，你仍可手动选择风格', false);
    }
  }

  // 绘制人脸检测框
  function drawFaceOverlay(faces) {
    const overlay = els.faceOverlay;
    const source = state.sourceType === 'video' ? els.sourceVideo : els.sourceImage;
    const rect = source.getBoundingClientRect();
    const wrap = source.parentElement.getBoundingClientRect();

    overlay.width = rect.width;
    overlay.height = rect.height;
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.left = (rect.left - wrap.left) + 'px';
    overlay.style.top = (rect.top - wrap.top) + 'px';

    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (!faces.length) return;

    const scaleX = rect.width / (state.sourceType === 'video' ? els.sourceVideo.videoWidth : els.sourceImage.naturalWidth);
    const scaleY = rect.height / (state.sourceType === 'video' ? els.sourceVideo.videoHeight : els.sourceImage.naturalHeight);

    for (const face of faces) {
      const { x, y, width, height } = face.box;
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 3;
      ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);

      ctx.fillStyle = 'rgba(233, 69, 96, 0.15)';
      ctx.fillRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
    }
  }

  // 生成表情包
  async function generateForSelectedStyle() {
    if (!state.selectedStyle || !state.currentImage) return;

    state.isGenerating = true;
    // 进入步骤 3：结果
    goToStep(3);
    updateStatus('正在生成表情包…', true);

    try {
      const caption = state.customCaption || null;

      // 静态图
      const staticRes = MemeEngine.generateStatic(
        state.currentImage,
        state.expression,
        state.selectedStyle,
        state.seed,
        state.faceBoxes,
        caption,
        MemeEngine.getHotTopics()
      );
      state.staticResult = staticRes;

      // 动态 GIF
      const animatedRes = await MemeEngine.generateAnimated(
        state.currentImage,
        state.expression,
        state.selectedStyle,
        state.seed,
        state.faceBoxes,
        caption,
        MemeEngine.getHotTopics(),
        (percent) => {
          els.gifProgressBar.style.setProperty('--percent', percent + '%');
          els.gifProgressText.textContent = percent + '%';
        }
      );
      state.animatedResult = animatedRes;

      showResult();
      updateStatus('生成完成', false);

      // 保存到展示区
      saveToShowcase(state.staticResult, state.selectedStyle, state.expressionLabel);
    } catch (err) {
      console.error(err);
      updateStatus('生成失败', false);
      showError('生成表情包失败：' + (err.message || '请重试'));
    } finally {
      state.isGenerating = false;
    }
  }

  function showResult() {
    if (state.resultType === 'static') {
      els.resultImage.src = state.staticResult?.dataUrl || '';
      els.resultImage.hidden = false;
      els.resultGif.hidden = true;
      els.gifProgress.classList.add('hidden');
      els.downloadBtn.textContent = '💾 保存静态图';
    } else {
      els.resultImage.hidden = true;
      els.resultGif.src = state.animatedResult?.dataUrl || '';
      els.resultGif.hidden = false;
      els.gifProgress.classList.remove('hidden');
      els.downloadBtn.textContent = '💾 保存动态图';
    }
  }

  function downloadResult() {
    const dataUrl = state.resultType === 'static'
      ? state.staticResult?.dataUrl
      : state.animatedResult?.dataUrl;
    if (!dataUrl) return;

    const ext = state.resultType === 'static' ? 'png' : 'gif';
    const filename = `表情包_${state.selectedStyle?.name}_${Date.now()}.${ext}`;

    // 安卓 WebView 桥接：调用原生保存到相册
    if (typeof window.Android !== 'undefined' && window.Android.saveImage) {
      try {
        window.Android.saveImage(dataUrl, filename);
        return;
      } catch (e) {
        console.warn('Android 保存桥接失败，降级使用浏览器下载:', e);
      }
    }

    // 浏览器 / iOS 默认下载方式
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }

  // 工具函数
  function updateStatus(text, loading) {
    els.statusText.textContent = text;
    els.statusBar.querySelector('.spinner').style.display = loading ? 'inline-block' : 'none';
  }

  function showError(msg) {
    els.errorBox.textContent = msg;
    els.errorBox.classList.remove('hidden');
  }

  function hideError() {
    els.errorBox.classList.add('hidden');
  }

  function showSection(el) {
    el.classList.remove('hidden');
  }

  function hideSection(el) {
    el.classList.add('hidden');
  }

  function resetState(full = true) {
    state.seed = 0;
    state.staticResult = null;
    state.animatedResult = null;
    state.selectedStyle = null;
    state.customCaption = '';
    state.resultType = 'static';
    state.isGenerating = false;
    els.styleGrid.querySelectorAll('.style-item').forEach(i => i.classList.remove('active'));
    els.resultTabs.forEach(t => t.classList.toggle('active', t.dataset.type === 'static'));
    els.captionInput.value = '';
    hideSection(els.captionEdit);
    if (full) {
      state.sourceUrl = null;
      state.sourceType = null;
      state.currentImage = null;
      state.expression = 'neutral';
      state.expressionLabel = '平静';
      state.faceBoxes = [];
    }
  }

  function resetApp() {
    stopCamera();
    resetState(true);
    els.sourceImage.src = '';
    els.sourceVideo.src = '';
    hideError();
    hideSection(els.detectInfo);
    hideSection(els.captionEdit);
    els.resultTabs.forEach(t => t.classList.toggle('active', t.dataset.type === 'static'));
    goToStep(0);
  }

  function waitForImage(img) {
    return new Promise((resolve, reject) => {
      if (img.complete && img.naturalWidth) return resolve();
      img.onload = () => resolve();
      img.onerror = reject;
    });
  }

  function waitForVideoMetadata(video) {
    return new Promise((resolve, reject) => {
      if (video.readyState >= 2) return resolve();
      video.onloadedmetadata = () => resolve();
      video.onerror = reject;
    });
  }

  function waitForVideoSeek(video) {
    return new Promise((resolve) => {
      const handler = () => {
        video.removeEventListener('seeked', handler);
        resolve();
      };
      video.addEventListener('seeked', handler);
    });
  }

  // 展示区：保存和渲染（Supabase 全网共享 + localStorage 本地备份）
  const SHOWCASE_KEY = 'meme_showcase';
  const MAX_SHOWCASE = 20;
  const BASE_COUNT = 1123;

  // 内置示例展示条目（新用户首次打开时看到的内容）
  const SAMPLE_SHOWCASE = [
    { caption: '笑不活了家人们', style: '沙雕吐槽', expression: '开心', color: '#e94560' },
    { caption: '瞳孔地震中', style: '震惊体', expression: '惊讶', color: '#533483' },
    { caption: '我佛了', style: '经典上下字', expression: '平静', color: '#0f3460' },
    { caption: '气到变形', style: '阴阳怪气', expression: '生气', color: '#e74c3c' },
    { caption: '社死现场直播', style: '社死现场', expression: '害怕', color: '#2ecc71' },
    { caption: '可爱到犯规', style: '可爱治愈', expression: '开心', color: '#ff9ff3' },
    { caption: '今日份emo', style: '电影字幕', expression: '难过', color: '#48dbfb' },
    { caption: '精神状态遥遥领先', style: '沙雕吐槽', expression: '开心', color: '#feca57' },
    { caption: '我直接愣住', style: '震惊体', expression: '惊讶', color: '#6c5ce7' },
    { caption: '面无表情打工', style: '经典上下字', expression: '平静', color: '#00b894' }
  ];

  // 生成示例条目的缩略图（canvas 绘制的彩色卡片）
  function generateSampleThumbnail(item) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, 100, 120);
    grad.addColorStop(0, item.color || '#e94560');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 100, 120);

    // 表情 emoji
    const emojiMap = { '开心': '😂', '惊讶': '😱', '平静': '😐', '生气': '😡', '害怕': '😨', '难过': '😢', '厌恶': '🤢' };
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.fillText(emojiMap[item.expression] || '😂', 50, 55);

    // 底部文案
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 90, 100, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(item.caption || '', 50, 108);

    return canvas.toDataURL('image/jpeg', 0.6);
  }

  // 从 Supabase 加载全网展示数据
  async function loadGlobalShowcase() {
    if (!SupabaseBackend.ready()) return;

    try {
      // 并行获取计数器和展示条目
      const [counter, items] = await Promise.all([
        SupabaseBackend.getCounter(),
        SupabaseBackend.getShowcaseItems(MAX_SHOWCASE)
      ]);

      if (counter !== null) {
        state.globalCounter = counter;
        state.totalCount = counter;
      }

      if (items && items.length > 0) {
        // 用全网数据替换本地展示
        renderShowcaseItems(items.map(item => ({
          thumb: item.thumbnail || '',
          caption: item.caption || '',
          style: item.style || '',
          expression: item.expression || ''
        })));
      }

      updateCounterDisplay();
    } catch (e) {
      console.warn('加载全网展示数据失败:', e);
    }
  }

  function saveToShowcase(result, style, expressionLabel) {
    if (!result || !result.dataUrl) return;

    // 生成缩略图（异步）
    createThumbnail(result.dataUrl, 100).then(thumbDataUrl => {
      const entry = {
        thumb: thumbDataUrl,
        caption: result.caption || '',
        style: style?.name || '',
        expression: expressionLabel || '',
        time: Date.now()
      };

      // 保存到本地 localStorage
      let items = [];
      try { items = JSON.parse(localStorage.getItem(SHOWCASE_KEY) || '[]'); } catch (e) {}
      items.unshift(entry);
      if (items.length > MAX_SHOWCASE) items = items.slice(0, MAX_SHOWCASE);
      try { localStorage.setItem(SHOWCASE_KEY, JSON.stringify(items)); } catch (e) {}

      // 更新计数器
      state.totalCount++;

      // 保存到 Supabase（全网共享）
      if (SupabaseBackend.ready()) {
        SupabaseBackend.incrementCounter().then(newVal => {
          if (newVal !== null) {
            state.globalCounter = newVal;
            state.totalCount = newVal;
            updateCounterDisplay();
          }
        });
        SupabaseBackend.addShowcaseItem({
          thumbnail: thumbDataUrl,
          caption: result.caption || '',
          style: style?.name || '',
          expression: expressionLabel || ''
        });
      }

      // 重新渲染展示区
      renderShowcase();
    });
  }

  function createThumbnail(dataUrl, maxSize) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = Math.round(maxSize * 1.2);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function updateCounterDisplay() {
    if (els.showcaseCount) {
      const count = state.globalCounter || state.totalCount || BASE_COUNT;
      els.showcaseCount.textContent = `已生成 ${count.toLocaleString()} 张`;
    }
  }

  // 渲染展示区条目到 DOM
  function renderShowcaseItems(items) {
    if (!els.showcaseScroll || !items || items.length === 0) return;

    els.showcaseScroll.innerHTML = items.map(item => {
      const thumbSrc = item.thumb || generateSampleThumbnail({ caption: item.caption, expression: item.expression, color: '#e94560' });
      return `
        <div class="showcase-item">
          <img src="${thumbSrc}" alt="${item.caption || ''}" loading="lazy">
          <div class="showcase-caption">${item.caption || ''}</div>
        </div>
      `;
    }).join('');
  }

  function renderShowcase() {
    // 更新计数器显示
    updateCounterDisplay();

    if (!els.showcaseScroll) return;

    // 优先使用本地缓存数据
    let items = [];
    try { items = JSON.parse(localStorage.getItem(SHOWCASE_KEY) || '[]'); } catch (e) {}

    if (items.length > 0) {
      renderShowcaseItems(items);
      return;
    }

    // 无本地数据时，显示内置示例条目
    const sampleItems = SAMPLE_SHOWCASE.map(item => ({
      thumb: generateSampleThumbnail(item),
      caption: item.caption,
      style: item.style,
      expression: item.expression
    }));
    renderShowcaseItems(sampleItems);
  }

  // 启动
  init();
})();
