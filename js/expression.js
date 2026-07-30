/**
 * 表情识别模块
 * 基于 face-api.js 实现本地人脸检测与表情分类
 */

const MODEL_URL = './assets/models';

const ExpressionModule = (() => {
  let isLoaded = false;
  let loadPromise = null;

  const expressionLabels = {
    neutral: '平静',
    happy: '开心',
    sad: '难过',
    angry: '生气',
    fearful: '害怕',
    disgusted: '厌恶',
    surprised: '惊讶'
  };

  async function loadModels() {
    if (isLoaded) return;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      isLoaded = true;
    })();

    return loadPromise;
  }

  function isReady() {
    return isLoaded;
  }

  /**
   * 检测图片中的人脸与表情
   * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
   * @returns {Promise<{faces: Array, dominant: string|null, expressions: Object|null, landmarks: Array}>}
   */
  async function detect(input) {
    await loadModels();

    // 多轮检测策略：逐步降低阈值 + 增大输入尺寸，提高检测成功率
    const attempts = [
      { inputSize: 512, scoreThreshold: 0.3 },
      { inputSize: 608, scoreThreshold: 0.2 },
      { inputSize: 416, scoreThreshold: 0.15 }
    ];

    let detections = [];
    for (const opts of attempts) {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: opts.inputSize,
        scoreThreshold: opts.scoreThreshold
      });

      try {
        detections = await faceapi
          .detectAllFaces(input, options)
          .withFaceLandmarks()
          .withFaceExpressions();
      } catch (e) {
        console.warn(`检测尝试失败 (inputSize=${opts.inputSize}):`, e);
        continue;
      }

      if (detections && detections.length > 0) break;
    }

    if (!detections || detections.length === 0) {
      return { faces: [], dominant: null, expressions: null, landmarks: [] };
    }

    // 选取面积最大的人脸作为主表情
    let mainFace = detections[0];
    let maxArea = 0;
    for (const d of detections) {
      const box = d.detection.box;
      const area = box.width * box.height;
      if (area > maxArea) {
        maxArea = area;
        mainFace = d;
      }
    }

    const expressions = mainFace.expressions || {};
    const dominant = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    return {
      faces: detections.map(d => ({
        box: d.detection.box,
        score: d.detection.score,
        expressions: d.expressions
      })),
      dominant,
      expressions,
      landmarks: detections.map(d => d.landmarks)
    };
  }

  function getExpressionLabel(key) {
    return expressionLabels[key] || key;
  }

  function getExpressionEmoji(key) {
    const map = {
      neutral: '😐',
      happy: '😄',
      sad: '😢',
      angry: '😡',
      fearful: '😨',
      disgusted: '🤢',
      surprised: '😲'
    };
    return map[key] || '😐';
  }

  return {
    loadModels,
    isReady,
    detect,
    getExpressionLabel,
    getExpressionEmoji,
    expressionLabels
  };
})();
