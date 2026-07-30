/**
 * 梗图生成引擎
 * 负责根据表情、风格生成静态/动态表情包
 */

const MemeEngine = (() => {
  // 生成风格定义
  const styles = [
    {
      id: 'classic',
      emoji: '😂',
      name: '经典上下字',
      desc: '暴走漫画式经典配文',
      renderer: 'classic'
    },
    {
      id: 'roast',
      emoji: '🗣️',
      name: '沙雕吐槽',
      desc: '对话框+犀利吐槽',
      renderer: 'roast'
    },
    {
      id: 'shock',
      emoji: '😱',
      name: '震惊体',
      desc: '大字报+震惊效果',
      renderer: 'shock'
    },
    {
      id: 'socialdeath',
      emoji: '💀',
      name: '社死现场',
      desc: '尴尬到脚趾抠地',
      renderer: 'socialdeath'
    },
    {
      id: 'passive',
      emoji: '🙃',
      name: '阴阳怪气',
      desc: '反讽拉满',
      renderer: 'passive'
    },
    {
      id: 'wholesome',
      emoji: '🥺',
      name: '可爱治愈',
      desc: '软萌暖心文案',
      renderer: 'wholesome'
    },
    {
      id: 'subtitle',
      emoji: '🎬',
      name: '电影字幕',
      desc: '底部字幕条+电影感',
      renderer: 'subtitle'
    }
  ];

  // 文案库：按表情分类，每组提供多个笑点
  const captions = {
    happy: {
      classic: ['一笑倾城', '我直接快乐起飞'],
      roast: ['笑这么开心，彩票中了？', '嘴角咧到后脑勺了'],
      shock: ['震惊！这个人居然在笑', '笑容满分，建议出圈'],
      socialdeath: ['笑太大声，全公司都听见了', '公共场合笑成鹅叫'],
      passive: ['笑吧，反正我也不想上班', '表面上很开心，实际上……更开心'],
      wholesome: ['你的笑容是我今天的糖', '开心就好，其他都不重要'],
      subtitle: ['《开心的我》', '今日份快乐已到账']
    },
    sad: {
      classic: ['我哭了，你呢', 'emo 了家人们'],
      roast: ['眼泪是晚上流的，人是白天疯的', '这表情，老板看了都沉默'],
      shock: ['震惊！TA 竟然哭了', '眼泪说来就来，演技派'],
      socialdeath: ['在公司哭出声，谁懂', '开会时突然破防'],
      passive: ['我很好，真的', '没事，习惯了'],
      wholesome: ['抱抱，明天会好的', '允许自己难过一小会儿'],
      subtitle: ['《深夜 emo 实录》', '眼泪不争气地流了下来']
    },
    angry: {
      classic: ['我气笑了', '血压飙升'],
      roast: ['这表情，甲方看了连夜改需求', '怒火中烧但还得保持微笑'],
      shock: ['震惊！此人正在生气', '愤怒值 99%'],
      socialdeath: ['生气时被截图，变成全群表情包', '开会怒怼老板后冷静三秒'],
      passive: ['我没事，呵呵', '你开心就好'],
      wholesome: ['深呼吸，世界和平', '生气也可爱'],
      subtitle: ['《怒火攻心》', '我一般不生气，除非忍不住']
    },
    surprised: {
      classic: ['瞳孔地震', '我直接愣住'],
      roast: ['这表情，吃瓜吃到自己家', '眼睛瞪得像铜铃'],
      shock: ['震惊！TA 看到了什么', '震惊部年终 KPI 靠你了'],
      socialdeath: ['震惊到在公共场合张大嘴', '看到工资条的表情'],
      passive: ['哇，真的吗（棒读）', '好意外哦，才怪'],
      wholesome: ['小小的脑袋，大大的问号', '好奇宝宝上线'],
      subtitle: ['《瞳孔地震》', '这是什么操作']
    },
    neutral: {
      classic: ['面无表情', '打工人的日常'],
      roast: ['眼神里写满了"关我屁事"', '波澜不惊，像极了我的人生'],
      shock: ['震惊！此人毫无表情', '面无表情本身就是一种表情'],
      socialdeath: ['面无表情地社死', '尴尬到失去表情管理'],
      passive: ['哦，所以呢', '挺好的（无感情）'],
      wholesome: ['平静也是一种力量', '淡定如我'],
      subtitle: ['此时一位靓仔路过', '表面风平浪静']
    },
    fearful: {
      classic: ['我害怕', '瑟瑟发抖'],
      roast: ['这表情，看见甲方需求了？', '惊恐如鼠'],
      shock: ['震惊！TA 在害怕什么', '恐惧值拉满'],
      socialdeath: ['在人群中被点名', '演讲时突然忘词'],
      passive: ['我没事，就是有点想逃', '真的不吓人'],
      wholesome: ['别怕，有我在', '小可爱受惊了'],
      subtitle: ['《瑟瑟发抖》', '我害怕但我不能说']
    },
    disgusted: {
      classic: ['嫌弃', '地铁老人看手机'],
      roast: ['这表情，看到前任朋友圈了？', '嫌弃写满全脸'],
      shock: ['震惊！TA 居然嫌弃', '嫌弃程度爆表'],
      socialdeath: ['当众露出嫌弃脸', '看到黑暗料理的表情'],
      passive: ['真不错呢（反话）', '我可没嫌弃'],
      wholesome: ['有点可爱怎么回事', '小表情还挺丰富'],
      subtitle: ['《地铁老人看手机》', '这什么东西']
    }
  };

  // 兜底文案
  const fallback = {
    classic: ['这表情，绝了', '今日份表情包'],
    roast: ['这脸，我能笑一年', '表情管理大师'],
    shock: ['震惊！这表情火了', '全网爆款预定'],
    socialdeath: ['当场社死', '尴尬到想逃'],
    passive: ['呵呵，你懂的', '表面风平浪静'],
    wholesome: ['可爱捏', '今日份治愈'],
    subtitle: ['《今日份表情》', '这一幕我熟']
  };

  function getCaption(expression, styleId, seed = 0) {
    const list = (captions[expression] && captions[expression][styleId])
      || fallback[styleId]
      || fallback.classic;
    return list[seed % list.length];
  }

  function getStyleOptions() {
    return styles;
  }

  // 加载图片为 Image 对象
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // 获取视频某一帧为图片
  function getVideoFrame(video, time = 0) {
    return new Promise((resolve) => {
      const canvas = document.getElementById('videoFrameCanvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      loadImage(dataUrl).then(resolve);
    });
  }

  // 计算最佳输出尺寸，保持比例并限制最大边
  function fitSize(width, height, max = 512) {
    const ratio = Math.min(max / width, max / height, 1);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
      ratio
    };
  }

  // 绘制文字，自动换行
  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align = 'center') {
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    const chars = text.split('');
    let line = '';
    const lines = [];
    for (const char of chars) {
      const test = line + char;
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2;
    if (align === 'top') startY = y;
    if (align === 'bottom') startY = y - totalHeight;

    for (let i = 0; i < lines.length; i++) {
      const ly = startY + i * lineHeight;
      // 描边
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'black';
      ctx.strokeText(lines[i], x, ly);
      // 填充
      ctx.fillStyle = 'white';
      ctx.fillText(lines[i], x, ly);
    }
    return totalHeight;
  }

  // 经典上下字
  function renderClassic(ctx, img, width, height, caption, faceBoxes) {
    ctx.drawImage(img, 0, 0, width, height);
    const fontSize = Math.max(24, Math.min(width / 8, 52));
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', fontSize * 2.2);
    const y = Math.min(zone.y, height - fontSize * 1.2);
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    drawWrappedText(ctx, caption, width / 2, y, width * 0.9, fontSize * 1.2);
  }

  // 沙雕吐槽对话框
  function renderRoast(ctx, img, width, height, caption, faceBoxes) {
    ctx.drawImage(img, 0, 0, width, height);
    const fontSize = Math.max(20, Math.min(width / 9, 42));
    const bubbleW = width * 0.82;
    const bubbleH = fontSize * 3.2;
    const zone = findSafeZone(width, height, faceBoxes, 'top', bubbleH + 28);
    const by = Math.max(zone.y - bubbleH / 2, height * 0.04);
    const bx = (width - bubbleW) / 2;
    const triangleY = by + bubbleH;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    roundRect(ctx, bx, by, bubbleW, bubbleH, 18);
    ctx.fill();
    ctx.stroke();

    // 小三角指向人脸方向
    ctx.beginPath();
    ctx.moveTo(width / 2 - 12, triangleY);
    ctx.lineTo(width / 2, triangleY + 16);
    ctx.lineTo(width / 2 + 12, triangleY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawWrappedText(ctx, caption, width / 2, by + bubbleH / 2, bubbleW - 24, fontSize * 1.25);
  }

  // 震惊体大字报
  function renderShock(ctx, img, width, height, caption, faceBoxes) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((Math.random() - 0.5) * 0.04);
    ctx.scale(1.08, 1.08);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    const fontSize = Math.max(28, Math.min(width / 6, 60));
    const zone = findSafeZone(width, height, faceBoxes, 'auto', fontSize * 2.6);
    const y = Math.max(fontSize, Math.min(zone.y, height - fontSize));

    ctx.save();
    ctx.translate(width / 2, y);
    ctx.rotate(zone.position === 'bottom' ? 0.04 : -0.04);
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", Impact, sans-serif`;
    drawWrappedText(ctx, caption, 0, 0, width * 0.85, fontSize * 1.15);
    ctx.restore();

    // 感叹号
    ctx.font = `700 ${fontSize * 1.2}px sans-serif`;
    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    const markY = zone.position === 'bottom' ? height * 0.18 : height * 0.88;
    ctx.strokeText('!!!', width * 0.85, markY);
    ctx.fillText('!!!', width * 0.85, markY);
  }

  // 社死现场
  function renderSocialDeath(ctx, img, width, height, caption, faceBoxes) {
    ctx.drawImage(img, 0, 0, width, height);

    // 暗角
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const fontSize = Math.max(22, Math.min(width / 8, 44));
    const zone = findSafeZone(width, height, faceBoxes, 'auto', fontSize * 2.4);
    const y = Math.max(fontSize, Math.min(zone.y, height - fontSize));

    ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawWrappedText(ctx, caption, width / 2, y, width * 0.88, fontSize * 1.2);

    ctx.font = '24px sans-serif';
    const skullY = zone.position === 'bottom' ? height * 0.12 : height * 0.9;
    ctx.fillText('💀', width * 0.88, skullY);
  }

  // 阴阳怪气
  function renderPassive(ctx, img, width, height, caption, faceBoxes) {
    ctx.drawImage(img, 0, 0, width, height);
    const fontSize = Math.max(22, Math.min(width / 8, 42));
    const barH = fontSize * 2.4;
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', barH + 16);
    const barY = Math.min(zone.y + barH / 2, height - barH / 2);

    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;

    // 黑条
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, barY - barH / 2, width, barH);

    drawWrappedText(ctx, caption, width / 2, barY, width * 0.92, fontSize * 1.15);

    // 角落 emoji
    ctx.font = '30px sans-serif';
    ctx.fillText('🙃', width * 0.05, height * 0.1);
    ctx.fillText('🍵', width * 0.88, height * 0.9);
  }

  // 电影字幕
  function renderSubtitle(ctx, img, width, height, caption, faceBoxes) {
    ctx.drawImage(img, 0, 0, width, height);

    const fontSize = Math.max(20, Math.min(width / 10, 36));
    const barH = fontSize * 2.4;
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', barH + 16);
    const barY = Math.min(zone.y + barH / 2, height - barH / 2);

    // 电影黑边
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, barY - barH / 2, width, barH);

    // 小黄字
    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawWrappedText(ctx, caption, width / 2, barY, width * 0.9, fontSize * 1.15);

    // 电影角标
    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('🎬 自制热梗', width * 0.05, height * 0.06);
  }

  // 可爱治愈
  function renderWholesome(ctx, img, width, height, caption, faceBoxes) {
    ctx.save();
    ctx.fillStyle = '#fff0f5';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const fontSize = Math.max(20, Math.min(width / 9, 38));
    const barH = Math.max(height * 0.22, fontSize * 2.4);
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', barH);
    const barY = Math.min(zone.y + barH / 2, height - barH / 2);
    const imgH = barY - barH / 2;

    ctx.drawImage(img, 0, 0, width, imgH);

    // 粉色底
    ctx.fillStyle = '#ffcce0';
    ctx.fillRect(0, imgH, width, height - imgH);

    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawWrappedText(ctx, caption, width / 2, imgH + (height - imgH) / 2, width * 0.9, fontSize * 1.2);

    // 小爱心
    ctx.font = '24px sans-serif';
    ctx.fillText('💖', width * 0.05, height * 0.08);
    ctx.fillText('✨', width * 0.88, height * 0.08);
  }

  // 根据人脸位置计算安全的文字区域
  function findSafeZone(width, height, faceBoxes, preferred = 'auto', minHeight = 60) {
    // 将人脸框归一化到输出尺寸
    const boxes = (faceBoxes || []).map(b => ({
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height
    }));

    if (boxes.length === 0) {
      if (preferred === 'bottom') return { y: height - minHeight / 2, maxHeight: height * 0.3, position: 'bottom' };
      if (preferred === 'top') return { y: minHeight / 2, maxHeight: height * 0.25, position: 'top' };
      return { y: height * 0.12, maxHeight: height * 0.22, position: 'top' };
    }

    // 按垂直位置排序
    const sorted = [...boxes].sort((a, b) => a.y - b.y);
    const zones = [];
    let lastBottom = 0;

    for (const box of sorted) {
      const gap = box.y - lastBottom;
      if (gap >= minHeight) {
        zones.push({ y: lastBottom, h: gap, position: 'top' });
      }
      lastBottom = Math.max(lastBottom, box.y + box.height);
    }
    if (height - lastBottom >= minHeight) {
      zones.push({ y: lastBottom, h: height - lastBottom, position: 'bottom' });
    }

    if (zones.length === 0) {
      return { y: height * 0.1, maxHeight: height * 0.2, position: 'top' };
    }

    // 优先使用指定位置，否则选最大区域
    let zone;
    if (preferred !== 'auto') {
      const preferredZones = zones.filter(z => z.position === preferred);
      zone = preferredZones.length
        ? preferredZones.sort((a, b) => b.h - a.h)[0]
        : zones.sort((a, b) => b.h - a.h)[0];
    } else {
      zone = zones.sort((a, b) => b.h - a.h)[0];
    }

    return {
      y: zone.y + zone.h / 2,
      maxHeight: zone.h,
      position: zone.position
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function renderFrame(ctx, renderer, img, width, height, caption, frameIndex, totalFrames, faceBoxes) {
    const t = frameIndex / Math.max(1, totalFrames - 1);
    ctx.clearRect(0, 0, width, height);

    switch (renderer) {
      case 'classic':
        renderClassic(ctx, img, width, height, caption, faceBoxes);
        break;
      case 'roast':
        renderRoast(ctx, img, width, height, caption, faceBoxes);
        break;
      case 'shock':
        renderShock(ctx, img, width, height, caption, faceBoxes);
        break;
      case 'socialdeath':
        renderSocialDeath(ctx, img, width, height, caption, faceBoxes);
        break;
      case 'passive':
        renderPassive(ctx, img, width, height, caption, faceBoxes);
        break;
      case 'wholesome':
        renderWholesome(ctx, img, width, height, caption, faceBoxes);
        break;
      case 'subtitle':
        renderSubtitle(ctx, img, width, height, caption, faceBoxes);
        break;
      default:
        renderClassic(ctx, img, width, height, caption, faceBoxes);
    }

    // 动态效果叠加
    if (totalFrames > 1) {
      ctx.save();
      if (renderer === 'shock') {
        // 震动
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#fff';
        const offset = Math.sin(t * Math.PI * 8) * 4;
        ctx.fillRect(offset, 0, width, height);
      } else if (renderer === 'classic') {
        // 轻微缩放脉冲
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, width * 0.4 * (1 + Math.sin(t * Math.PI * 2) * 0.05), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 将人脸框从原图坐标缩放到输出画布坐标
  function scaleFaceBoxes(faceBoxes, srcWidth, srcHeight, outWidth, outHeight) {
    if (!faceBoxes || !faceBoxes.length) return [];
    const sx = outWidth / srcWidth;
    const sy = outHeight / srcHeight;
    return faceBoxes.map(b => ({
      x: b.x * sx,
      y: b.y * sy,
      width: b.width * sx,
      height: b.height * sy
    }));
  }

  /**
   * 生成静态表情包
   * @param {HTMLImageElement} sourceImg
   * @param {string} expression
   * @param {Object} style
   * @param {number} seed
   * @param {Array} faceBoxes 原图坐标系的人脸框
   * @param {string|null} customCaption 自定义文案，为空则使用 AI 推荐
   * @returns {Object} {dataUrl, caption}
   */
  function generateStatic(sourceImg, expression, style, seed = 0, faceBoxes = [], customCaption = null) {
    const size = fitSize(sourceImg.naturalWidth, sourceImg.naturalHeight, 640);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');

    const caption = customCaption || getCaption(expression, style.id, seed);
    const scaledBoxes = scaleFaceBoxes(faceBoxes, sourceImg.naturalWidth, sourceImg.naturalHeight, size.width, size.height);
    renderFrame(ctx, style.renderer, sourceImg, size.width, size.height, caption, 0, 1, scaledBoxes);

    return {
      dataUrl: canvas.toDataURL('image/png'),
      caption
    };
  }

  /**
   * 生成动态 GIF 表情包
   * @param {HTMLImageElement} sourceImg
   * @param {string} expression
   * @param {Object} style
   * @param {number} seed
   * @param {Array} faceBoxes 原图坐标系的人脸框
   * @param {string|null} customCaption 自定义文案，为空则使用 AI 推荐
   * @param {Function} onProgress
   * @returns {Promise<Object>} {dataUrl, caption}
   */
  function generateAnimated(sourceImg, expression, style, seed = 0, faceBoxes = [], customCaption = null, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      if (typeof GIF === 'undefined') {
        reject(new Error('GIF 库未加载'));
        return;
      }

      const size = fitSize(sourceImg.naturalWidth, sourceImg.naturalHeight, 480);
      const caption = customCaption || getCaption(expression, style.id, seed + 1);
      const scaledBoxes = scaleFaceBoxes(faceBoxes, sourceImg.naturalWidth, sourceImg.naturalHeight, size.width, size.height);
      const totalFrames = 12;
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: size.width,
        height: size.height,
        workerScript: 'js/gif.worker.js'
      });

      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');

      gif.on('progress', (p) => onProgress(Math.round(p * 100)));
      gif.on('finished', (blob) => {
        onProgress(100);
        const reader = new FileReader();
        reader.onloadend = () => resolve({ dataUrl: reader.result, caption });
        reader.readAsDataURL(blob);
      });
      gif.on('error', reject);

      for (let i = 0; i < totalFrames; i++) {
        renderFrame(ctx, style.renderer, sourceImg, size.width, size.height, caption, i, totalFrames, scaledBoxes);
        gif.addFrame(ctx, { copy: true, delay: 120 });
      }

      gif.render();
    });
  }

  return {
    styles,
    getStyleOptions,
    getCaption,
    loadImage,
    getVideoFrame,
    fitSize,
    generateStatic,
    generateAnimated
  };
})();
