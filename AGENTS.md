# AGENTS.md

给在本仓库工作的 AI 编程助手的规则。项目是 Expo / React Native 应用（Android APK + 网页版），图标库已用 `lucide-react-native`。

## 工作方式

- 动手前先检查需求有没有错误前提、逻辑跳跃和信息缺失，有就先指出
- 不迎合，独立判断；回答时区分事实、预测和主观观点
- 涉及数字、人物和结论时尽量核实来源，并写明出处
- 做任何东西先找开源项目或现成组件，找到后按用户描述微调，不从零造轮子
- 引用或改写外部代码前确认许可证允许，并在代码注释里注明来源和许可证

## 文件与环境

- 需要下载的东西默认放在项目目录内；没有项目的对话放 D 盘
- 在 Windows 上不在 C 盘工作（除非另有要求）；需要用 C 盘或 C 盘已有的环境时，先征得用户同意并切换到别的盘
- 以上盘符规则只适用于 Windows；云端或 Linux 容器里按项目目录处理

## 界面设计

### 色调

- 白色为主，黑色和蓝色为辅
- 红色等其他颜色只用于特殊状态（错误、警告、删除等）

### 动画

- 每个元素都要有出现动画、过渡动画和消失动画
- 重视元素之间的无缝衔接，像 PPT 的平滑切换一样：同一元素在不同状态或页面之间通过位置、尺寸、形状的变形过渡（Morph Transition / shared element），不要生硬地闪现或跳变
- 系统开启「减少动态效果」（`prefers-reduced-motion` / `AccessibilityInfo.isReduceMotionEnabled`）时，改用淡入淡出或直接切换

### 交互

- 注重交互，小交互也必须做：按钮按下轻微缩小、松开回弹，悬停轻微放大等
- 所有可点击元素都要有按下、悬停、禁用状态的反馈

### 文字与图标

- 标题、按钮、标签等短文字适当省略标点符号
- 不使用 emoji，统一用开源 UI 图标（本项目用 lucide）

### 可参考的前端组件来源

- Beautiful UI — beautifului.dev
- BeUI — beui.dev
- Rare UI — rareui.com
- Transitions — transitions.dev
- shadcn/ui — ui.shadcn.com

这些多为网页（React DOM / Tailwind）组件，用在本项目时需改写为 React Native 写法；使用前先看各自的许可证。
