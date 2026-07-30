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
    previewSection: document.getElementById('previewSection'),
    sourceImage: document.getElementById('sourceImage'),
    sourceVideo: document.getElementById('sourceVideo'),
    faceOverlay: document.getElementById('faceOverlay'),
    statusBar: document.getElementById('statusBar'),
    statusText: document.getElementById('statusText'),
    detectInfo: document.getElementById('detectInfo'),
    faceCount: document.getElementById('faceCount'),
    expressionBadge: document.getElementById('expressionBadge'),
    errorBox: document.getElementById('errorBox'),
    optionsSection: document.getElementById('optionsSection'),
    styleGrid: document.getElementById('styleGrid'),
    captionEdit: document.getElementById('captionEdit'),
    captionInput: document.getElementById('captionInput'),
    autoCaptionBtn: document.getElementById('autoCaptionBtn'),
    generateBtn: document.getElementById('generateBtn'),
    resultSection: document.getElementById('resultSection'),
    resultImage: document.getElementById('resultImage'),
    resultGif: document.getElementById('resultGif'),
    gifProgress: document.getElementById('gifProgress'),
    gifProgressBar: document.getElementById('gifProgressBar'),
    gifProgressText: document.getElementById('gifProgressText'),
    downloadBtn: document.getElementById('downloadBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    backBtn: document.getElementById('backBtn'),
    resultTabs: document.querySelectorAll('.tab-btn')
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
    isGenerating: false
  };

  // 初始化
  async function init() {
    bindEvents();
    renderStyleOptions();

    // 检查是否由 Web Share Target 进入
    checkSharedFile();

    updateStatus('正在加载 AI 模型，请稍候…', true);
    try {
      await ExpressionModule.loadModels();
      updateStatus('AI 模型加载完成，请上传图片/视频', false);
    } catch (err) {
      console.error(err);
      updateStatus('模型加载失败，请刷新重试', false);
      showError('AI 模型加载失败：' + (err.message || '未知错误'));
    }
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
    els.cameraBtn.addEventListener('click', toggleCamera);

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
      const suggested = MemeEngine.getCaption(state.expression, state.selectedStyle?.id, state.seed);
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
      // 如果用户没手动改文案，继续用 AI 推荐；否则保留当前文案
      if (!state.customCaption) {
        const suggested = MemeEngine.getCaption(state.expression, state.selectedStyle?.id, state.seed);
        els.captionInput.value = suggested;
      }
      generateForSelectedStyle();
    });
    els.backBtn.addEventListener('click', resetApp);
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

        // 生成推荐文案并填入编辑框
        const suggested = MemeEngine.getCaption(state.expression, state.selectedStyle.id, state.seed);
        els.captionInput.value = suggested;
        state.customCaption = '';

        // 滚动到文案编辑区
        els.captionEdit.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
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

    showSection(els.previewSection);
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

  // 相机拍照
  let cameraStream = null;
  let isCameraMode = false;
  async function toggleCamera() {
    if (isCameraMode && cameraStream) {
      // 拍照
      const video = els.cameraPreview;
      const canvas = els.captureCanvas;
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-shot.jpg', { type: 'image/jpeg' });
        handleFile(file);
      }, 'image/jpeg', 0.92);
      stopCamera();
      return;
    }

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      els.cameraPreview.srcObject = cameraStream;
      els.cameraPreview.hidden = false;
      els.cameraBtn.textContent = '📸 点击拍照';
      isCameraMode = true;
    } catch (err) {
      showError('无法调用摄像头：' + (err.message || '请检查权限'));
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    els.cameraPreview.hidden = true;
    els.cameraBtn.textContent = '📷 拍照';
    isCameraMode = false;
  }

  // 检测人脸并渲染
  async function detectAndRender() {
    updateStatus('正在识别人脸与表情…', true);
    hideError();

    try {
      const result = await ExpressionModule.detect(state.currentImage);
      drawFaceOverlay(result.faces);

      if (result.faces.length === 0) {
        hideSection(els.optionsSection);
        hideSection(els.resultSection);
        updateStatus('未检测到人物，请换一张带人脸的图片', false);
        showError('没有识别到人脸，工具无法生成基于人物的表情。请上传正面、光线充足、人物清晰的图片/视频。');
        return;
      }

      state.expression = result.dominant;
      state.expressionLabel = ExpressionModule.getExpressionLabel(result.dominant);
      state.faceBoxes = result.faces.map(f => f.box);

      els.faceCount.textContent = `检测到 ${result.faces.length} 张人脸`;
      els.expressionBadge.textContent = `表情：${state.expressionLabel} ${ExpressionModule.getExpressionEmoji(state.expression)}`;
      showSection(els.detectInfo);

      updateStatus('识别完成，请选择生成风格', false);
      showSection(els.optionsSection);

      // 自动滚动到选项区
      els.optionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      updateStatus('识别失败', false);
      showError('人脸检测出错：' + (err.message || '请重试'));
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
    hideSection(els.resultSection);
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
        caption
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
        (percent) => {
          els.gifProgressBar.style.setProperty('--percent', percent + '%');
          els.gifProgressText.textContent = percent + '%';
        }
      );
      state.animatedResult = animatedRes;

      showSection(els.resultSection);
      showResult();
      updateStatus('生成完成', false);
      els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `表情包_${state.selectedStyle?.name}_${Date.now()}.${ext}`;
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
    hideSection(els.previewSection);
    hideSection(els.optionsSection);
    hideSection(els.resultSection);
    hideError();
    els.sourceImage.src = '';
    els.sourceVideo.src = '';
    els.fileInput.value = '';
    updateStatus('AI 模型加载完成，请上传图片/视频', false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // 启动
  init();
})();
