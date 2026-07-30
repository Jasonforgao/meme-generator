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

  // 文案库：按表情 × 风格分类，每组 10 条
  // 融入网络热梗、发疯文学、阴阳怪气、节目效果
  const captions = {
    happy: {
      classic: ['一笑倾城，再笑倾国', '我直接快乐起飞', '今天这波笑容，稳了', '嘴角咧到银河系', '快乐星球持证居民', '笑容攻击，接招', '今日份开心已超载', '笑出八块腹肌', '我笑起来真好看', '快乐配方：笑容+1'],
      roast: ['笑这么开心，彩票中了？', '嘴角咧到后脑勺了', '你小子，中五百万了？', '笑得我手机都拿不稳', '这位选手，表情管理满分', '笑成这样，家里拆迁了？', '你的笑容吵到我的眼睛了', '笑得这么放肆，不要命啦', ' clearly 精神状态遥遥领先', '笑点被踩爆了吗'],
      shock: ['震惊！这个人居然在笑', '笑容满分，建议出圈', '震惊部：此笑容含糖量过高', '笑得我 CPU 烧了', '这笑容，泼天的富贵来了', '震惊！TA 尊嘟好开心', '笑容恐怖如斯', '全网通缉这个笑容', '震惊！快乐病毒入侵', '这笑，遥遥领先'],
      socialdeath: ['笑太大声，全公司都听见了', '公共场合笑成鹅叫', '老板路过时我笑出了猪叫', '会议室里笑出鹅叫，谁懂', '地铁上笑到邻座换位置', '笑点太低被赶出群聊', '公共场合发出拖拉机笑声', '笑到被当成显眼包', '社死，但真的好笑', '脚趾抠地但嘴角上天'],
      passive: ['笑吧，反正我也不想上班', '表面上很开心，实际上……更开心', '笑这么甜，是要甜死谁', '开心得毫不掩饰，真不错呢', '我笑了我装的？不，我真笑了', '你的快乐吵到我了（羡慕）', '笑得这么开心，建议扣工资', '呵，谁还没个开心的时候了', '表面上云淡风轻，心里放烟花', '笑吧，明天还要上班'],
      wholesome: ['你的笑容是我今天的糖', '开心就好，其他都不重要', '笑一笑，功德加一', '今日份快乐已签收', '你笑起来，世界都亮了', '小太阳今天照常营业', '快乐小狗在线营业', '愿你的笑容永远免费', '这是今日最佳笑容', '治愈系笑容，收藏了'],
      subtitle: ['《开心的我》', '今日份快乐已到账', '《笑容大爆炸》', '《快乐星球居民》', '《我笑起来真好看》', '《嘴角咧到银河系》', '《今日份开心已超载》', '《泼天的富贵到账》', '《精神状态遥遥领先》', '《笑容含糖量超标》']
    },
    sad: {
      classic: ['我哭了，你呢', 'emo 了家人们', '深夜 emo 冠军', '眼泪不争气地流', '悲伤逆流成河', 'emo 不分早晚', '我很好我没事', '眼泪它有自己的想法', '今天的雨好大', 'emo 人 emo 魂'],
      roast: ['眼泪是晚上流的，人是白天疯的', '这表情，老板看了都沉默', '哭得这么有层次，奥斯卡欠你奖', '眼泪说来就来，建议去演戏', '这委屈程度，堪比乙方改稿', '哭得我手机都进水了', '你的眼泪我的快乐（不是）', '这表情，甲方看了都愧疚', '悲伤辣么大', '哭得像个两百斤的孩子'],
      shock: ['震惊！TA 竟然哭了', '眼泪说来就来，演技派', '震惊！此人 emo 值爆表', '眼泪产量遥遥领先', '震惊！快乐它离家出走', '这泪腺，尊嘟假嘟', '震惊！悲伤它突然袭击', '全网围观你流泪', '震惊！眼睛在下雨', '这表情，CPU 干烧了'],
      socialdeath: ['在公司哭出声，谁懂', '开会时突然破防', '在电梯里哭被全程目击', '聚餐时想起前任当场泪崩', '工位上流泪被同事截图', '面试时想到工资条哭了', '地铁上哭成狗', '开会破防被全组看见', '哭到成为公司传说', '当众 emo，社死加倍'],
      passive: ['我很好，真的', '没事，习惯了', '挺好的，也就一般难过', '没事，反正没人care', '我没事，只是眼泪不听使唤', '哦，无所谓', '习惯了，真的', '问题不大，也就心碎', '我很好（假话）', '没事，忍忍就过去了'],
      wholesome: ['抱抱，明天会好的', '允许自己难过一小会儿', '哭出来就好啦', '你的眼泪值得被接住', '今天难过也没关系', '明天又是新的一天', '难过也要记得喝水', '允许悲伤，也允许快乐', '你值得被温柔对待', '雨后会有彩虹的'],
      subtitle: ['《深夜 emo 实录》', '眼泪不争气地流了下来', '《悲伤逆流成河》', '《我哭了，我装的？》', '《emo 不分早晚》', '《眼泪它有自己的想法》', '《今日份破防》', '《我很好，真的》', '《悲伤它突然袭击》', '《明天会好的》']
    },
    angry: {
      classic: ['我气笑了', '血压飙升', '怒火中烧', '愤怒值 MAX', '气得我原地爆炸', '我裂开', '气到变形', ' rage 模式启动', '当场去世', '血压直接拉满'],
      roast: ['这表情，甲方看了连夜改需求', '怒火中烧但还得保持微笑', '气得我功德都扣没了', '这怒气，能煮三锅火锅', '生气都这么可爱，不要命啦', '你的愤怒吵到我的眼睛了', '气成河豚，但还要上班', '这表情，老板看了加工资', '愤怒的小鸟本鸟', '气得我CPU烧了'],
      shock: ['震惊！此人正在生气', '愤怒值 99%', '震惊！怒气值突破天际', '震惊！TA尊嘟很生气', '震惊部：此人气到发光', '愤怒指数遥遥领先', '震惊！火气大到能烧烤', '全网感受这份愤怒', '震惊！生气也这么有梗', '这愤怒，芭比Q了'],
      socialdeath: ['生气时被截图，变成全群表情包', '开会怒怼老板后冷静三秒', '愤怒发消息误发工作群', '气到拍桌子全办公室围观', '群里发火被发现已读不回', '生气时手抖点成视频通话', '怒火中烧忘记关麦', '气到在公共场合吼出声', '愤怒表情包被老板保存', '社死，但气还没消'],
      passive: ['我没事，呵呵', '你开心就好', '我一点都不生气呢', '真的没关系哦', '我很好，呵呵', '没事，你继续', '我无所谓的，真的', '没事，我习惯了', '挺好的，呵呵', '我没事，只是拳头硬了'],
      wholesome: ['深呼吸，世界和平', '生气也可爱', '气鼓鼓的样子像小河豚', '消消气，吃颗糖', '愤怒会过去，可爱不会', '深呼吸，功德加一', '不气不气，气坏自己', '你的怒火我来灭火', '抱抱，消消气', '生气也是真实的小可爱'],
      subtitle: ['《怒火攻心》', '我一般不生气，除非忍不住', '《愤怒的小鸟》', '《气得我原地爆炸》', '《血压飙升实录》', '《怒气值 MAX》', '《我没事，呵呵》', '《气得我功德扣完》', '《尊嘟很生气》', '《怒火中烧但还要上班》']
    },
    surprised: {
      classic: ['瞳孔地震', '我直接愣住', '目瞪狗呆', '当场石化', '震惊一百年', '我人傻了', '大脑宕机', '这是什么展开', '我裂开了', '惊掉下巴'],
      roast: ['这表情，吃瓜吃到自己家', '眼睛瞪得像铜铃', '震惊到隐形眼镜都掉了', '这反应，奥斯卡欠你奖', '眼珠子快瞪出来了', '你的震惊吵到我的眼睛了', '这波表情管理，零分', '惊讶得像第一次见到WiFi', '震惊到原地起跳', '这表情，能当显眼包了'],
      shock: ['震惊！TA 看到了什么', '震惊部年终 KPI 靠你了', '震惊！此人瞳孔地震', '震惊！这也行？', '震惊值直接爆表', '震惊！尊嘟假嘟', '震惊！CPU 当场干烧', '震惊！这展开绝了', '全网震惊脸预定', '震惊！遥遥领先'],
      socialdeath: ['震惊到在公共场合张大嘴', '看到工资条的表情', '惊讶到发出鸡叫', '震惊时口水流出来被看到', '瞪眼张嘴被拍成表情包', '在安静场所惊呼出声', '震惊到打翻奶茶', '看到前任时表情失控', '面试时听到薪资瞳孔地震', '当众目瞪狗呆'],
      passive: ['哇，真的吗（棒读）', '好意外哦，才怪', '哦？是吗？', '哇，好震惊哦（无感情）', '真的假的，我完全不信', '好意外呢，才怪', '哇，吓死我了（假的）', '太震惊了，我装一下', '尊嘟假嘟，我不信', '哦，就这？'],
      wholesome: ['小小的脑袋，大大的问号', '好奇宝宝上线', '哇，发现新世界', '惊讶也是可爱的反应', '对世界充满好奇', '瞪大眼睛好可爱', '好奇小猫本猫', '哇，好神奇', '保持好奇，保持可爱', '你的惊讶很真实'],
      subtitle: ['《瞳孔地震》', '这是什么操作', '《目瞪狗呆》', '《我人傻了》', '《CPU 当场干烧》', '《吃瓜吃到自己家》', '《尊嘟假嘟》', '《震惊一百年》', '《大脑宕机》', '《好奇宝宝上线》']
    },
    neutral: {
      classic: ['面无表情', '打工人的日常', '波澜不惊', '淡定如我', '情绪稳定', '心如止水', '我佛了', '一脸平静', '稳如老狗', '情绪管理大师'],
      roast: ['眼神里写满了"关我屁事"', '波澜不惊，像极了我的人生', '这表情，老板看了都放心', '面瘫式打工', '面无表情但心里骂了一万句', '你的淡定让我害怕', '平静得像一潭死水', '面无表情地摸鱼', '这脸，AI 都识别不出情绪', '稳，但没啥用'],
      shock: ['震惊！此人毫无表情', '面无表情本身就是一种表情', '震惊！情绪稳定到可怕', '震惊！此人已出家', '震惊！淡定到发光', '震惊！心如止水', '情绪稳定指数遥遥领先', '震惊！这脸比湖面还平', '全网最稳表情', '震惊！根本猜不透'],
      socialdeath: ['面无表情地社死', '尴尬到失去表情管理', '面无表情地打翻咖啡', '淡定地走进错厕所', '面无表情地念错老板名字', '社死但假装无事发生', '尴尬到脸僵住', '面无表情地成为表情包', '社死现场最佳表情管理', '淡定地承受一切'],
      passive: ['哦，所以呢', '挺好的（无感情）', '关我屁事', '哦，知道了', '随便吧', '都行，无所谓', '嗯，然后呢', '哦，挺好', '无所谓，我会摆烂', '哦，就这？'],
      wholesome: ['平静也是一种力量', '淡定如我', '情绪稳定，未来可期', '平静的小日子', '稳稳的幸福', '内心安宁，万物可爱', '淡定的人最酷', '心如止水，岁月静好', '平静也是超能力', '做一个情绪稳定的大人'],
      subtitle: ['此时一位靓仔路过', '表面风平浪静', '《情绪稳定》', '《打工人的日常》', '《关我屁事》', '《波澜不惊》', '《心如止水》', '《淡定如我》', '《面无表情本身就是一种表情》', '《我佛了》']
    },
    fearful: {
      classic: ['我害怕', '瑟瑟发抖', '吓死宝宝了', '弱小可怜又无助', '当场吓哭', '不敢动', '我人没了', '恐惧使我变形', '弱小如我', '吓出一身冷汗'],
      roast: ['这表情，看见甲方需求了？', '惊恐如鼠', '吓得我手机都掉了', '这表情，像极了看到账单的我', '惊恐到原地升天', '吓得我功德都没了', '这表情，鬼见了都愣住', '恐惧值爆表但还要装酷', '吓得我CPU干烧了', '这惊恐程度，建议买保险'],
      shock: ['震惊！TA 在害怕什么', '恐惧值拉满', '震惊！此人瑟瑟发抖', '震惊！恐惧病毒入侵', '震惊！这也能吓到TA', '恐惧指数遥遥领先', '震惊！害怕到发光', '全网围观惊恐现场', '震惊！尊嘟好害怕', '这恐惧，芭比Q了'],
      socialdeath: ['在人群中被点名', '演讲时突然忘词', '被老师点名时表情失控', '开会时被cue到瞳孔地震', '当众被cue全身僵硬', '在安静场所手机突然外放', '惊吓时叫出声被围观', '恐怖片高潮时摸到旁边人的手', '被老板点名瑟瑟发抖', '公共场合突然受到惊吓'],
      passive: ['我没事，就是有点想逃', '真的不吓人', '我一点都不怕，真的', '没事，腿软而已', '我很好，只是有点抖', '不怕，就是心跳快了点', '真的没事，呵呵', '我没事，只是出点汗', '不怕，我会装镇定', '没事，我装的'],
      wholesome: ['别怕，有我在', '小可爱受惊了', '抱抱，不怕不怕', '受惊的小表情好可爱', '有我在，不用怕', '摸摸头，吓不着', '勇敢一点，你很棒', '小胆子也没关系', '别怕，噩梦会过去', '抱紧我的小可爱'],
      subtitle: ['《瑟瑟发抖》', '我害怕但我不能说', '《弱小可怜又无助》', '《吓死宝宝了》', '《当场吓哭》', '《恐惧值拉满》', '《尊嘟好害怕》', '《不敢动》', '《CPU 干烧中》', '《别怕，有我在》']
    },
    disgusted: {
      classic: ['嫌弃', '地铁老人看手机', '一脸嫌弃', '这什么鬼', '没眼看', '辣眼睛', '不忍直视', '嫌弃三连', '我瞎了', '地铁爷爷看手机'],
      roast: ['这表情，看到前任朋友圈了？', '嫌弃写满全脸', '嫌弃程度能炒一盘菜', '你的嫌弃吵到我的眼睛了', '这表情，看到黑暗料理了？', '嫌弃得像吃到香菜', '这脸，能当嫌弃表情包冠军', '嫌弃到想退网', '这表情，导演看了都喊卡', '嫌弃值直接拉满'],
      shock: ['震惊！TA 居然嫌弃', '嫌弃程度爆表', '震惊！嫌弃到变形', '震惊！这都能嫌弃', '嫌弃指数遥遥领先', '震惊！尊嘟很嫌弃', '震惊！嫌弃成表情包', '全网感受这份嫌弃', '震惊！眼睛都在嫌弃', '这嫌弃，芭比Q了'],
      socialdeath: ['当众露出嫌弃脸', '看到黑暗料理的表情', '聚餐时表情管理失败', '嫌弃脸被同桌拍下', '当众翻白眼被发现', '看到老板穿搭露出嫌弃', '相亲时表情没藏住', '嫌弃得太明显被瞪回来', '在镜头前露出真实表情', '社死，但真的很嫌弃'],
      passive: ['真不错呢（反话）', '我可没嫌弃', '挺好的，我没嫌弃', '真好吃呢（才怪）', '我没嫌弃，真的', '哇，好棒哦（无感情）', '真不错，我喜欢（假的）', '我可没翻白眼', '挺好的，你开心就好', '我没嫌弃，只是不想看'],
      wholesome: ['有点可爱怎么回事', '小表情还挺丰富', '嫌弃也这么可爱', '小眉头皱得好可爱', '虽然嫌弃但还是很萌', '这嫌弃脸我能看一百遍', '可爱到无法嫌弃', '小表情超有戏', '嫌弃也是真实的小可爱', '皱眉头也好看'],
      subtitle: ['《地铁老人看手机》', '这什么东西', '《一脸嫌弃》', '《辣眼睛》', '《没眼看》', '《尊嘟很嫌弃》', '《嫌弃三连》', '《地铁爷爷看手机》', '《这什么鬼》', '《小表情还挺丰富》']
    }
  };

  // 兜底文案：每组 10 条，保证切换有足够素材
  const fallback = {
    classic: ['这表情，绝了', '今日份表情包', '表情管理大师', '这一眼，万年', '今日最佳表情', '这脸，我能笑一年', '表情帝本帝', '这一帧，封神', '今日份快乐源泉', '这表情，有梗'],
    roast: ['这脸，我能笑一年', '表情管理大师', '这表情，建议出圈', '脸上写满了故事', '这表情，我能做成连环画', '表情帝就是你', '这脸，自带笑点', '建议送去参赛', '这表情，梗太多了', '脸上全是戏'],
    shock: ['震惊！这表情火了', '全网爆款预定', '震惊！表情帝上线', '这表情，遥遥领先', '震惊部年度精选', '震惊！尊嘟好有梗', '这表情，CPU干烧了', '全网围观此表情', '震惊！这也太有戏', '震惊值爆表'],
    socialdeath: ['当场社死', '尴尬到想逃', '脚趾抠出三室一厅', '大型社死现场', '尴尬到原地去世', '社死但好笑', '当场想换个星球', '尴尬到失去表情管理', '社死名场面', '脚趾已经开始动工'],
    passive: ['呵呵，你懂的', '表面风平浪静', '挺好的（无感情）', '哦，所以呢', '你开心就好', '我没意见，真的', '嗯，不错呢', '随便吧', '无所谓，我会摆烂', '表面云淡风轻'],
    wholesome: ['可爱捏', '今日份治愈', '你看起来好乖', '今日份可爱已到账', '软萌软萌的', '治愈系表情', '小可爱本可爱', '今日份温柔', '你值得被喜欢', '萌萌哒'],
    subtitle: ['《今日份表情》', '这一幕我熟', '《表情帝上线》', '《今日最佳》', '《我直接愣住》', '《这表情绝了》', '《全场最佳》', '《表情包素材》', '《今日份快乐源泉》', '《有梗》']
  };

  // 表情对应的反应词库，用于热梗融合
  const expressionReactions = {
    happy: ['笑出声', '嘴角上天', '快乐起飞', '笑到打鸣', '开心到模糊', '笑出鹅叫', '快乐加倍', '嘴角咧到后脑勺'],
    sad: ['蚌埠住了', 'emo了', '破防了', '眼泪不争气', '悲伤辣么大', '深夜 emo', '我哭了', '心碎成二维码'],
    angry: ['血压飙升', '气笑了', '拳头硬了', '怒火中烧', '气得原地爆炸', '功德扣完', ' rage 模式', '当场裂开'],
    surprised: ['瞳孔地震', '目瞪狗呆', 'CPU烧了', '当场石化', '大脑宕机', '惊掉下巴', '我人傻了', '震惊一百年'],
    neutral: ['面无表情', '心如止水', '情绪稳定', '波澜不惊', '一脸平静', '我佛了', '淡定如我', '稳如老狗'],
    fearful: ['瑟瑟发抖', '吓死宝宝', '当场吓哭', '弱小无助', '不敢动', '惊恐万分', '我人没了', '吓出冷汗'],
    disgusted: ['地铁老人看手机', '嫌弃', '辣眼睛', '没眼看', '不忍直视', '嫌弃三连', '我瞎了', '这什么鬼']
  };

  // 风格对应的模板，{topic} 会被替换为热梗，{reaction} 替换为表情反应
  const hotTopicTemplates = {
    classic: [
      '看到{topic}，{reaction}',
      '{topic}，{reaction}',
      '{reaction}，{topic}了',
      '{topic}，这谁顶得住',
      '今日热梗：{topic}',
      '{topic}，直接{reaction}',
      '因为{topic}，{reaction}',
      '{topic}，笑不活了',
      '{topic}，全场最佳',
      '论{topic}，{reaction}'
    ],
    roast: [
      '看到{topic}的你 be like',
      '{topic}？这我熟',
      '当{topic}遇上我，{reaction}',
      '不是，{topic}也能火？',
      '{topic}，我真的会谢',
      '这{topic}，夺笋啊',
      '{topic}，你礼貌吗',
      '笑死，{topic}',
      '{topic}，栓Q',
      '家人们谁懂啊，{topic}'
    ],
    shock: [
      '震惊！{topic}竟然……',
      '{topic}，全网震惊',
      '震惊部：{topic}来了',
      '震惊！{topic}真的假的',
      '{topic}，尊嘟假嘟',
      '震惊！{topic}遥遥领先',
      '因为{topic}，全网CPU烧了',
      '震惊！{topic}还能这样',
      '{topic}，震惊我全家',
      '震惊！{topic}又上热搜'
    ],
    socialdeath: [
      '在{topic}现场社死',
      '当众{topic}，尴尬到抠脚',
      '{topic}，脚趾开始动工',
      '因为{topic}，当场社死',
      '{topic}，大型社死现场',
      '在{topic}面前失去表情管理',
      '{topic}，尴尬到想换星球',
      '当众{topic}，谁懂',
      '{topic}，社死但好笑',
      '因为{topic}，抠出三室一厅'
    ],
    passive: [
      '{topic}？真不错呢',
      '哇，{topic}，好厉害哦',
      '{topic}，我可没酸',
      '哦，{topic}，所以呢',
      '{topic}，你开心就好',
      '真棒呢，{topic}',
      '{topic}，我没破防',
      '哇，{topic}，绝了（反话）',
      '{topic}，我一点都不羡慕',
      '呵呵，{topic}'
    ],
    wholesome: [
      '{topic}也很可爱呀',
      '{topic}也要开心',
      '因为{topic}，今天更可爱了',
      '{topic}，抱抱',
      '{topic}，愿你被温柔以待',
      '可爱的你遇到{topic}',
      '{topic}，也要记得微笑',
      '小小的{topic}，大大的治愈',
      '{topic}，今日份可爱',
      '因为{topic}，世界更甜了'
    ],
    subtitle: [
      '《{topic}》',
      '《关于{topic}这件事》',
      '《{topic}的诱惑》',
      '《当我遇到{topic}》',
      '《{topic}，{reaction}》',
      '《{topic}风云》',
      '《论{topic}的杀伤力》',
      '《{topic}现场》',
      '《今日热梗：{topic}》',
      '《因为{topic}，我{reaction}》'
    ]
  };

  // 默认热梗源（用户可配置）
  const DEFAULT_HOT_TOPICS_URL = './hot-topics.json';
  let hotTopicsList = [];

  function getCaption(expression, styleId, seed = 0, hotTopics = [], expressionLabel = '') {
    // 表情描述词库，用于热梗融合时让文案更贴合图像表情
    const expressionDescMap = {
      happy: ['笑脸', '傻笑', '美滋滋', '笑容减不住', '嘴角落不下来', '笑得像个傻子', '开心到飞起'],
      sad: ['苦脸', '泪流满面', '委屈巴巴', '眼泪汪汪', '愁眉苦脸', '泪崩', '悲伤溢出屏幕'],
      angry: ['怒容', '气到变形', '火冒三丈', '青筋暴起', '咬牙忍忍忍', '暴怒模式', '眼神杀'],
      surprised: ['懵圈脸', '目瞪口哣', '惊呆下巴', '眼神地震', '瞳孔放大', '一脸懵通', '惊讶到模糊'],
      neutral: ['面瘫脸', '平静如水', '波澜不惊', '毫无波澜', '佛系表情', '淡定到发光', '面无表情'],
      fearful: ['惊恐脸', '吓得模糊', '瑟瑟发抖', '脸色发白', '眼神惊恐', '怂到不行', '吓到失语'],
      disgusted: ['嫌弃脸', '眉头紧锁', '眼神嫌弃', '一脸厌恶', '受不了', '表情崩塔', '嫌弃拉满']
    };
    const expressionDescs = expressionDescMap[expression] || expressionDescMap.neutral;
    const desc = expressionDescs[Math.abs(seed * 13) % expressionDescs.length];

    // 如果有热梗可用，有一定概率融合热梗生成新文案
    if (hotTopics && hotTopics.length > 0 && seed % 3 !== 0) {
      const topic = hotTopics[Math.abs(seed * 31) % hotTopics.length];
      const reactionList = expressionReactions[expression] || expressionReactions.neutral;
      const reaction = reactionList[Math.abs(seed * 17) % reactionList.length];
      const templates = hotTopicTemplates[styleId] || hotTopicTemplates.classic;
      const template = templates[Math.abs(seed * 7) % templates.length];
      let result = template.replace('{topic}', topic).replace('{reaction}', reaction);
      // 50% 概率加入表情描述词，让文案更贴合图像
      if (seed % 2 === 0) {
        result = `${result}（${desc}）`;
      }
      return result;
    }

    // 没有热梗时，优先使用表情专属文案库
    const list = (captions[expression] && captions[expression][styleId])
      || fallback[styleId]
      || fallback.classic;
    return list[seed % list.length];
  }

  // 从网络拉取热梗列表
  async function loadHotTopics(url = DEFAULT_HOT_TOPICS_URL, cacheMinutes = 60) {
    const cacheKey = `hot_topics_cache_${url}`;
    const timeKey = `hot_topics_time_${url}`;
    const now = Date.now();
    const cached = localStorage.getItem(cacheKey);
    const cachedTime = parseInt(localStorage.getItem(timeKey) || '0', 10);

    // 缓存未过期，优先使用本地缓存
    if (cached && (now - cachedTime) < cacheMinutes * 60 * 1000) {
      try {
        hotTopicsList = JSON.parse(cached);
        return { success: true, topics: hotTopicsList, fromCache: true };
      } catch (e) {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(timeKey);
      }
    }

    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const topics = Array.isArray(data) ? data : (data.topics || data.hot_topics || []);
      if (topics.length === 0) throw new Error('热梗列表为空');
      hotTopicsList = topics.filter(t => typeof t === 'string' && t.trim());
      localStorage.setItem(cacheKey, JSON.stringify(hotTopicsList));
      localStorage.setItem(timeKey, String(now));
      return { success: true, topics: hotTopicsList, fromCache: false };
    } catch (err) {
      console.warn('热梗加载失败:', err);
      return { success: false, topics: [], error: err.message };
    }
  }

  function getHotTopics() {
    return hotTopicsList;
  }

  function setHotTopics(topics) {
    hotTopicsList = Array.isArray(topics) ? topics.filter(t => typeof t === 'string' && t.trim()) : [];
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

  // 增强文字绘制，支持自定义填充色和描边色
  function drawText(ctx, text, x, y, maxWidth, lineHeight, opts = {}) {
    const fill = opts.fill || 'white';
    const stroke = opts.stroke || 'black';
    const lw = opts.lineWidth != null ? opts.lineWidth : 4;
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = 'top';
    const chars = text.split('');
    let line = '';
    const lines = [];
    for (const char of chars) {
      const test = line + char;
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && line) { lines.push(line); line = char; }
      else { line = test; }
    }
    if (line) lines.push(line);
    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2;
    if (opts.baseline === 'top') startY = y;
    if (opts.baseline === 'bottom') startY = y - totalHeight;
    for (let i = 0; i < lines.length; i++) {
      const ly = startY + i * lineHeight;
      if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(lines[i], x, ly); }
      ctx.fillStyle = fill;
      ctx.fillText(lines[i], x, ly);
    }
    return totalHeight;
  }

  // 原始 drawWrappedText 保持兼容
  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align) {
    return drawText(ctx, text, x, y, maxWidth, lineHeight, { align });
  }

  // 表情对应的装饰 emoji
  const exprEmojis = {
    happy: ['😂','🤣','😆','😄','🥳','🎉','✨','💛'],
    sad: ['😢','😭','💧','🥲','😿','💔','🌧️','😞'],
    angry: ['😡','🤬','💢','🔥','💥','😤','👊','⚡'],
    surprised: ['😱','🤯','😲','❗','⁉️','👀','💫','😮'],
    neutral: ['😐','😑','🫠','💤','🗿','😶','🧊','🫥'],
    fearful: ['😨','😰','😱','💀','👻','🫣','😬','🥶'],
    disgusted: ['🤢','🤮','😒','🙄','💩','👎','😤','🫤']
  };

  // 在指定区域散布 emoji 装饰
  function scatterEmojis(ctx, width, height, expression, count, avoidBoxes) {
    const pool = exprEmojis[expression] || exprEmojis.neutral;
    const fontSize = Math.max(16, Math.min(width / 20, 28));
    ctx.font = `${fontSize}px sans-serif`;
    for (let i = 0; i < count; i++) {
      const ex = pool[(i * 7 + 3) % pool.length];
      const px = ((i * 137 + 53) % 100) / 100 * width * 0.85 + width * 0.05;
      const py = ((i * 89 + 17) % 100) / 100 * height * 0.3;
      const fromBottom = i % 2 === 0;
      const finalY = fromBottom ? height - py : py;
      ctx.globalAlpha = 0.3 + (i % 3) * 0.15;
      ctx.fillText(ex, px, finalY);
    }
    ctx.globalAlpha = 1.0;
  }

  // 为文案自动添加 emoji 后缀
  function addEmojiToCaption(caption, expression, seed) {
    const pool = exprEmojis[expression] || exprEmojis.neutral;
    const e1 = pool[seed % pool.length];
    const e2 = pool[(seed * 3 + 1) % pool.length];
    // 如果文案已包含 emoji，不再追加
    if (/[\u{1F300}-\u{1FAFF}]/u.test(caption.slice(-4))) return caption;
    return `${caption} ${e1}${e2}`;
  }

  // 经典上下字 —— 渐变彩色大字 + emoji 装饰
  function renderClassic(ctx, img, width, height, caption, faceBoxes, expression) {
    ctx.drawImage(img, 0, 0, width, height);
    const fontSize = Math.max(24, Math.min(width / 8, 52));
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', fontSize * 2.2);
    const y = Math.min(zone.y, height - fontSize * 1.2);

    // 半透明渐变背景条
    const barH = fontSize * 2.4;
    const grad = ctx.createLinearGradient(0, y - barH * 0.3, 0, y + barH * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0.0)');
    grad.addColorStop(0.2, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - barH * 0.3, width, barH);

    // 彩色文字（黄→白渐变）
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    const textGrad = ctx.createLinearGradient(width * 0.1, y, width * 0.9, y);
    textGrad.addColorStop(0, '#ffe066');
    textGrad.addColorStop(0.5, '#ffffff');
    textGrad.addColorStop(1, '#ffe066');
    drawText(ctx, caption, width / 2, y, width * 0.88, fontSize * 1.2, { fill: textGrad, stroke: '#000', lineWidth: 5 });
  }

  // 沙雕吐槽 —— 白底对话框 + 气泡尾巴 + emoji 点缀
  function renderRoast(ctx, img, width, height, caption, faceBoxes, expression) {
    ctx.drawImage(img, 0, 0, width, height);
    const fontSize = Math.max(20, Math.min(width / 9, 42));
    const bubbleW = width * 0.84;
    const bubbleH = fontSize * 3.5;
    const zone = findSafeZone(width, height, faceBoxes, 'top', bubbleH + 30);
    const by = Math.max(zone.y - bubbleH / 2, height * 0.04);
    const bx = (width - bubbleW) / 2;

    // 带阴影的气泡
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#fff';
    roundRect(ctx, bx, by, bubbleW, bubbleH, 20);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;
    roundRect(ctx, bx, by, bubbleW, bubbleH, 20);
    ctx.stroke();

    // 小三角
    const triY = by + bubbleH;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 14, triY);
    ctx.lineTo(width / 2, triY + 18);
    ctx.lineTo(width / 2 + 14, triY);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();

    // 彩色文字
    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawText(ctx, caption, width / 2, by + bubbleH / 2, bubbleW - 28, fontSize * 1.3, { fill: '#222', stroke: 'transparent', lineWidth: 0 });

    // 角落 emoji
    const pool = exprEmojis[expression] || exprEmojis.neutral;
    ctx.font = `${fontSize * 0.8}px sans-serif`;
    ctx.fillText(pool[0], bx + 6, by + 4);
    ctx.fillText(pool[1], bx + bubbleW - fontSize, by + 4);
  }

  // 震惊体 —— 倾斜大字 + 黄色感叹号 + emoji 炸裂
  function renderShock(ctx, img, width, height, caption, faceBoxes, expression) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((Math.random() - 0.5) * 0.05);
    ctx.scale(1.1, 1.1);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    const fontSize = Math.max(30, Math.min(width / 5.5, 64));
    const zone = findSafeZone(width, height, faceBoxes, 'auto', fontSize * 2.8);
    const y = Math.max(fontSize, Math.min(zone.y, height - fontSize));

    // 红色发光效果
    ctx.save();
    ctx.translate(width / 2, y);
    ctx.rotate(zone.position === 'bottom' ? 0.05 : -0.05);
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", Impact, sans-serif`;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    drawText(ctx, caption, 0, 0, width * 0.85, fontSize * 1.15, { fill: '#fff', stroke: '#e94560', lineWidth: 6 });
    ctx.restore();

    // 大号感叹号和 emoji
    const markY = zone.position === 'bottom' ? height * 0.15 : height * 0.88;
    ctx.font = `900 ${fontSize * 1.3}px sans-serif`;
    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 4;
    ctx.strokeText('‼️', width * 0.82, markY);
    ctx.fillText('‼️', width * 0.82, markY);
    const pool = exprEmojis[expression] || exprEmojis.surprised;
    ctx.font = `${fontSize * 0.7}px sans-serif`;
    ctx.fillText(pool[2], width * 0.05, markY);
  }

  // 社死现场 —— 暗角 + 对角线文字 + emoji 散布
  function renderSocialDeath(ctx, img, width, height, caption, faceBoxes, expression) {
    ctx.drawImage(img, 0, 0, width, height);

    // 强暗角
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const fontSize = Math.max(22, Math.min(width / 8, 44));
    const zone = findSafeZone(width, height, faceBoxes, 'auto', fontSize * 2.4);
    const y = Math.max(fontSize, Math.min(zone.y, height - fontSize));

    // 倾斜文字 + 紫色描边
    ctx.save();
    ctx.translate(width / 2, y);
    ctx.rotate(-0.06);
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawText(ctx, caption, 0, 0, width * 0.88, fontSize * 1.2, { fill: '#f0f0f0', stroke: '#6c2d82', lineWidth: 5 });
    ctx.restore();

    // 💀 装饰
    ctx.font = `${fontSize * 0.9}px sans-serif`;
    const skullY = zone.position === 'bottom' ? height * 0.1 : height * 0.92;
    ctx.fillText('💀', width * 0.08, skullY);
    ctx.fillText('💀', width * 0.82, skullY);
    ctx.fillText('😭', width * 0.45, skullY + fontSize * 0.3);
  }

  // 阴阳怪气 —— 倾斜黑条 + 彩色反讽文字 + 角落 emoji
  function renderPassive(ctx, img, width, height, caption, faceBoxes, expression) {
    ctx.drawImage(img, 0, 0, width, height);
    const fontSize = Math.max(22, Math.min(width / 8, 42));
    const barH = fontSize * 2.6;
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', barH + 16);
    const barY = Math.min(zone.y + barH / 2, height - barH / 2);

    // 稍微倾斜的黑条
    ctx.save();
    ctx.translate(width / 2, barY);
    ctx.rotate(-0.03);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(-width / 2 - 10, -barH / 2, width + 20, barH);
    // 彩色文字（淡绿色反讽感）
    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawText(ctx, caption, 0, 0, width * 0.9, fontSize * 1.15, { fill: '#a8e6cf', stroke: '#000', lineWidth: 3 });
    ctx.restore();

    // 角落 emoji 组合
    ctx.font = `${fontSize * 0.8}px sans-serif`;
    ctx.fillText('🙃', width * 0.03, height * 0.08);
    ctx.fillText('🍵', width * 0.88, height * 0.08);
    ctx.fillText('🫠', width * 0.03, height * 0.92);
    ctx.fillText('💅', width * 0.88, height * 0.92);
  }

  // 电影字幕 —— 电影黑边 + 彩色宽屏文字 + 上下双 emoji
  function renderSubtitle(ctx, img, width, height, caption, faceBoxes, expression) {
    ctx.drawImage(img, 0, 0, width, height);
    const fontSize = Math.max(20, Math.min(width / 10, 36));
    const barH = fontSize * 2.6;
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', barH + 16);
    const barY = Math.min(zone.y + barH / 2, height - barH / 2);

    // 电影黑边（上下）
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, barY - barH / 2, width, barH);
    // 顶部窄黑边（电影感）
    ctx.fillRect(0, 0, width, height * 0.05);

    // 小黄字 + 更亮的描边
    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    const textGrad = ctx.createLinearGradient(width * 0.1, barY, width * 0.9, barY);
    textGrad.addColorStop(0, '#ffe066');
    textGrad.addColorStop(0.5, '#ffd700');
    textGrad.addColorStop(1, '#ffe066');
    drawText(ctx, caption, width / 2, barY, width * 0.88, fontSize * 1.15, { fill: textGrad, stroke: '#333', lineWidth: 2 });

    // 电影角标 + emoji
    const pool = exprEmojis[expression] || exprEmojis.neutral;
    ctx.font = `${fontSize * 0.6}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText(`🎬 自制热梗  ${pool[0]}`, width * 0.04, height * 0.035);
    ctx.textAlign = 'right';
    ctx.fillText(pool[1], width * 0.96, height * 0.035);
    ctx.textAlign = 'center';
  }

  // 可爱治愈 —— 柔和渐变底 + 彩色文字 + emoji 环绕
  function renderWholesome(ctx, img, width, height, caption, faceBoxes, expression) {
    const fontSize = Math.max(20, Math.min(width / 9, 38));
    const barH = Math.max(height * 0.24, fontSize * 2.6);
    const zone = findSafeZone(width, height, faceBoxes, 'bottom', barH);
    const barY = Math.min(zone.y + barH / 2, height - barH / 2);
    const imgH = barY - barH / 2;

    ctx.drawImage(img, 0, 0, width, imgH);

    // 柔和粉紫渐变底
    const grad = ctx.createLinearGradient(0, imgH, 0, height);
    grad.addColorStop(0, '#ffd1dc');
    grad.addColorStop(0.5, '#e8c5f0');
    grad.addColorStop(1, '#c5b3f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, imgH, width, height - imgH);

    // 彩色文字
    ctx.font = `700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    drawText(ctx, caption, width / 2, imgH + (height - imgH) / 2, width * 0.88, fontSize * 1.25, { fill: '#5b2c6f', stroke: '#fff', lineWidth: 3 });

    // emoji 装饰散布
    const pool = exprEmojis[expression] || exprEmojis.happy;
    ctx.font = `${fontSize * 0.75}px sans-serif`;
    ctx.fillText('💖', width * 0.04, height * 0.06);
    ctx.fillText('✨', width * 0.86, height * 0.06);
    ctx.fillText(pool[0], width * 0.04, imgH + 6);
    ctx.fillText(pool[1], width * 0.86, imgH + 6);
    ctx.fillText('🌸', width * 0.45, height * 0.04);
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

  function renderFrame(ctx, renderer, img, width, height, caption, frameIndex, totalFrames, faceBoxes, expression) {
    const t = frameIndex / Math.max(1, totalFrames - 1);
    ctx.clearRect(0, 0, width, height);

    switch (renderer) {
      case 'classic': renderClassic(ctx, img, width, height, caption, faceBoxes, expression); break;
      case 'roast': renderRoast(ctx, img, width, height, caption, faceBoxes, expression); break;
      case 'shock': renderShock(ctx, img, width, height, caption, faceBoxes, expression); break;
      case 'socialdeath': renderSocialDeath(ctx, img, width, height, caption, faceBoxes, expression); break;
      case 'passive': renderPassive(ctx, img, width, height, caption, faceBoxes, expression); break;
      case 'wholesome': renderWholesome(ctx, img, width, height, caption, faceBoxes, expression); break;
      case 'subtitle': renderSubtitle(ctx, img, width, height, caption, faceBoxes, expression); break;
      default: renderClassic(ctx, img, width, height, caption, faceBoxes, expression);
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
  function generateStatic(sourceImg, expression, style, seed = 0, faceBoxes = [], customCaption = null, hotTopics = []) {
    const size = fitSize(sourceImg.naturalWidth, sourceImg.naturalHeight, 640);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');

    const caption = addEmojiToCaption(customCaption || getCaption(expression, style.id, seed, hotTopics), expression, seed);
    const scaledBoxes = scaleFaceBoxes(faceBoxes, sourceImg.naturalWidth, sourceImg.naturalHeight, size.width, size.height);
    renderFrame(ctx, style.renderer, sourceImg, size.width, size.height, caption, 0, 1, scaledBoxes, expression);

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
  function generateAnimated(sourceImg, expression, style, seed = 0, faceBoxes = [], customCaption = null, hotTopics = [], onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      if (typeof GIF === 'undefined') {
        reject(new Error('GIF 库未加载'));
        return;
      }

      const size = fitSize(sourceImg.naturalWidth, sourceImg.naturalHeight, 480);
      const caption = addEmojiToCaption(customCaption || getCaption(expression, style.id, seed + 1, hotTopics), expression, seed);
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
        renderFrame(ctx, style.renderer, sourceImg, size.width, size.height, caption, i, totalFrames, scaledBoxes, expression);
        gif.addFrame(ctx, { copy: true, delay: 120 });
      }

      gif.render();
    });
  }

  return {
    styles,
    getStyleOptions,
    getCaption,
    loadHotTopics,
    getHotTopics,
    setHotTopics,
    loadImage,
    getVideoFrame,
    fitSize,
    generateStatic,
    generateAnimated
  };
})();
