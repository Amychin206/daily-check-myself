// Content for the 成长 tab: a daily practice based on Dan Koe's
// "How to fix your entire life in 1 day" — a life blueprint written once,
// then each day a few key actions, four check-ins, a self-score and an
// evening reflection.

export type Blueprint = {
  anti: string;
  vision: string;
  year: string;
  month: string;
  levers: string;
  rules: string;
  /** Answers to the one-day reset questions, by question key. */
  deep: Record<string, string>;
  updatedAt: string; // ISO timestamp; the newer side wins when merging devices
};

export type BlueprintField = Exclude<keyof Blueprint, 'deep' | 'updatedAt'>;

export type GrowthDay = {
  date: string; // YYYY-MM-DD
  levers: string[];
  done: boolean[];
  /** Answers to the check-in and evening questions, by question key. */
  notes: Record<string, string>;
  /** Self-scores from 1 to 5, by score key. */
  score: Record<string, number>;
  updatedAt: string;
};

export type GrowthData = { blueprint: Blueprint | null; days: Record<string, GrowthDay> };

export const CHECKS = [
  { key: 'c1', time: '11:00', hour: 11, minute: 0, q: '我现在做的事，是在逃避什么？' },
  { key: 'c2', time: '13:30', hour: 13, minute: 30, q: '如果过去两小时被录下来，别人会觉得我想要什么样的人生？' },
  { key: 'c3', time: '17:00', hour: 17, minute: 0, q: '有什么我假装不重要，其实最重要的事？' },
  { key: 'c4', time: '19:30', hour: 19, minute: 30, q: '今天哪件事是为了「保护旧身份」而做，不是因为真心想做？' },
];

export const EVENING = [
  { key: 'e1', q: '今天最真实的一个发现是什么？' },
  { key: 'e2', q: '今天哪一套旧信念跑出来拦住我？' },
  { key: 'e3', q: '明天最重要的一件事（写成「我是……的人，所以我会……」）' },
];

export const SCORES = [
  { key: 's1', label: '今天的行动符合我想成为的人' },
  { key: 's2', label: '今天保持清醒，没被自动驾驶带走' },
  { key: 's3', label: '今天离反愿景更远了一步' },
];

export const BOARD: { key: BlueprintField; name: string; role: string }[] = [
  { key: 'anti', name: '反愿景', role: '失败条件：一句话写下你绝不再变成的样子' },
  { key: 'vision', name: '愿景', role: '胜利条件：一句话写下你正在打造的人生' },
  { key: 'year', name: '1 年目标', role: '主线任务：一年后什么必须成真' },
  { key: 'month', name: '1 个月项目', role: 'Boss 战：这个月要拿下的成果或技能' },
  { key: 'levers', name: '每日杠杆', role: '每日任务：每行一件，会自动带到「今天」页面' },
  { key: 'rules', name: '约束条件', role: '游戏规则：为了愿景，你不愿牺牲的东西' },
];

export const DEEP: { group: string; qs: [string, string][] }[] = [
  {
    group: '一、正视不满',
    qs: [
      ['d1', '我已经习惯忍受的、不剧烈但一直存在的不满是什么？'],
      ['d2', '有哪些事我一直抱怨，却从来没改？'],
      ['d3', '如果别人只看我的行动，他们会觉得我真正想要什么？'],
      ['d4', '关于目前的生活，有什么真相是我不敢对尊敬的人承认的？'],
    ],
  },
  {
    group: '二、反愿景：绝对不想过的人生',
    qs: [
      ['d5', '如果 5 年后什么都没变，那时一个普通的星期二是什么样？'],
      ['d6', '再过 10 年呢？错过了什么？谁对我失望了？'],
      ['d7', '临终回看，这种「安全」的人生让我付出了什么代价？'],
      ['d8', '我一直用来不改变的那个说不出口的借口是什么？'],
    ],
  },
  {
    group: '三、愿景',
    qs: [
      ['d9', '先不管现不现实：3 年后理想中的普通星期二是什么样？'],
      ['d10', '要让那种生活变得自然，我必须相信自己是什么样的人？'],
    ],
  },
  {
    group: '四、晚上整合',
    qs: [
      ['d11', '我一直停滞不前，最接近真相的原因是什么？'],
      ['d12', '真正的敌人是我心里的哪一套信念？'],
    ],
  },
];

/** Reading notes: each block is a heading and paragraphs; **text** is shown bold. */
export const READING: { title: string; body: string[] }[] = [
  {
    title: '一、先换「身份」，再谈「行为」',
    body: [
      '大多数新年目标会失败，原因通常不是意志力不够，而是顺序搞错了。改变每天的行为是次要的；成为一个「自然会这样做的人」才是最根本的。',
      '健身者和成功的 CEO 在外人眼里很自律，其实对他们来说，吃垃圾食品、睡懒觉才是痛苦的事。那种生活对他们是常态，不靠意志力撑。所以想得到某个结果，必须在拿到结果**之前**就先过上能产生那个结果的生活。',
    ],
  },
  {
    title: '二、每个行为背后都有「隐藏目的」',
    body: [
      '借用阿德勒心理学的目的论：所有行为都有目的，包括伤害自己的行为。',
      '**拖延**：表面看是没自律，真正的目的可能是保护自己，免于作品完成后被人评判。',
      '**不辞掉没前途的工作**：不是没勇气，而是在换取稳定、可预测，以及不被看成「失败者」。',
      '所以真正的改变要在潜意识层面改写目标。目标就像一副眼镜，换了眼镜，看到的信息就不同，行为也跟着变。',
    ],
  },
  {
    title: '三、身份是怎么形成的，又为什么难改',
    body: [
      '设定目标 → 透过目标看世界 → 只学达成目标所需的东西 → 行动并获得反馈 → 重复到自动化 → 把这个行为当成「我就是这种人」→ 为了保持一致而捍卫这个身份 → 由它产生新目标。',
      '身份一旦固定，大脑就把它当成「生存」来保护。当你说「我就是不擅长运动」「我就是不爱冒险」而有人挑战时，你会本能地反抗。很多这类程序是从父母和社会继承来的，第一步就是去怀疑它们。',
    ],
  },
  {
    title: '四、聪明 = 能不能得到你想要的',
    body: [
      '引用 Naval 的观点：衡量智慧的真正标准，是能否从人生中得到你想要的。背后是控制论：有目标 → 行动 → 感知现状 → 与目标比较 → 根据反馈调整再行动。',
      '撞墙就放弃是不聪明；不断修正方向才是聪明。走弯路、走 Z 字形，其实也是在前进。',
    ],
  },
  {
    title: '五、一日重启流程',
    body: [
      '**上午 · 心理挖掘**：先正视不满，再写「反愿景」（绝对不想过的人生），等厌恶感够强再写愿景。',
      '**白天 · 打断自动驾驶**：11:00、13:30、17:00、19:30 用闹钟自问。',
      '**晚上 · 整合**：找出停滞的真正原因和内心的敌人，各用一句话写下反愿景和愿景，再拆成 1 年、1 个月、每天的镜头。',
      '完整题目在「蓝图」页的深度挖掘题，白天和晚上的题目在「今天」页。',
    ],
  },
];

export const GAME_TABLE: [string, string][] = [
  ['反愿景', '失败条件，你输掉的赌注'],
  ['愿景', '胜利条件'],
  ['1 年目标', '主线任务'],
  ['1 个月项目', 'Boss 战，练技能、拿成果'],
  ['每日杠杆', '每日任务，推进项目的关键动作'],
  ['约束条件', '游戏规则，你不愿牺牲的东西'],
];

export const GAME_NOTE =
  '这几层像同心圆的防护罩，帮你挡掉干扰。一直玩下去，原本要刻意努力的事，最终会变成你的身份本身。';

export const SUMMARY =
  '一天修不好整个人生，但能让你停止继续往错的方向走。真正的改变发生在你重新定义「我是谁」的那一刻。';

export function emptyBlueprint(): Blueprint {
  return { anti: '', vision: '', year: '', month: '', levers: '', rules: '', deep: {}, updatedAt: '' };
}

/** A day's starting state: today's key actions come from the blueprint's daily levers. */
export function newDay(date: string, blueprint: Blueprint | null): GrowthDay {
  const levers = (blueprint?.levers ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  while (levers.length < 3) levers.push('');
  return { date, levers, done: [false, false, false], notes: {}, score: {}, updatedAt: '' };
}

/** How many of the 7 reflection questions have an answer. */
export function answeredCount(day: GrowthDay | undefined): number {
  if (!day) return 0;
  return [...CHECKS, ...EVENING].filter((c) => (day.notes[c.key] ?? '').trim()).length;
}

export function averageScore(day: GrowthDay | undefined): number | null {
  const values = Object.values(day?.score ?? {});
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Index of the check-in to highlight now (from half an hour before its time), or -1. */
export function currentCheckIndex(now = new Date()): number {
  const minutes = now.getHours() * 60 + now.getMinutes();
  let idx = -1;
  CHECKS.forEach((c, i) => {
    if (minutes >= c.hour * 60 + c.minute - 30) idx = i;
  });
  return idx;
}
