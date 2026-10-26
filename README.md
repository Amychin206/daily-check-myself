# 每日成长 · Daily Check Myself

记录每天成长计划的 app：Android 手机安装 APK，电脑用网页版。

## 功能

- **6 个版面**：学习、读书、运动、健康饮食、休息、冥想
- **拍照打卡 + 日记**：每个版面每天一条，可以拍照或从相册选，再写几句日记；可以翻到以前的日子查看或补记
- **每日提醒**：每个版面单独开关、单独设置时间；点通知直接打开当天该版面的打卡页
- **统计图表**：连续打卡天数、最长连续、累计次数；最近 7 天柱状图；最近 12 周热力图；各版面近 30 天完成率
- **Google Drive 自动同步**：用 Google 账号登录后，记录和照片自动同步到你自己 Google Drive 里的 app 专用隐藏文件夹。在另一台手机上用同一账号登录即可。每次打开 app、每次修改后都会同步；同一天同一版面在两台手机上都改过的，以最后修改的为准
- **手动备份**：导出一个 `.zip`（包含所有打卡、日记和照片），可以存网盘或发到别的手机再导入；导入时会和现有记录合并

不登录也能正常使用，数据保存在本机（手机或电脑浏览器）上。

## 安装到手机（GitHub 自动打包 APK）

每次推送到 `main` 分支，GitHub Actions 会自动打包一个 APK，并发布到仓库的 **Releases** 页面。用手机打开 Releases，下载 `daily-check-myself.apk` 安装即可（第一次安装需要允许「安装未知来源应用」）。

打包需要两个仓库密钥（只需设置一次）：在仓库的 **Settings → Secrets and variables → Actions → New repository secret** 中添加：

| 名称 | 内容 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | 签名文件 `release.keystore.base64.txt` 的全部内容 |
| `ANDROID_KEYSTORE_PASSWORD` | `keystore-password.txt` 的内容 |

签名文件不在仓库里，请妥善保存：之后每次更新 app 都必须用同一个签名，否则无法覆盖安装，Google 登录也会失效。

## 在电脑上使用（网页版）

网址：**https://amychin206.github.io/daily-check-myself/**

每次推送到 `main`，GitHub Actions 会自动更新网页版。第一次需要在仓库 **Settings → Pages** 里把 **Source** 设为 **GitHub Actions**（仓库需要是 Public）。

网页版和手机版功能一样，只是：没有每日提醒；拍照改为从电脑选择照片；数据存在这个浏览器里，换浏览器或清除网站数据后需要靠 Google Drive 同步或备份恢复。网页版的 Google 授权每小时会过期，过期后在「我的」页面点一次「立即同步」即可继续。

## 开启 Google Drive 同步（只需设置一次，约 10 分钟）

Google 要求每个使用 Drive 的 app 在 Google Cloud 里登记。全部免费，用你平时的 Google 账号即可。

1. 打开 [Google Cloud 控制台](https://console.cloud.google.com/)，左上角「选择项目」→「新建项目」，名称随意（例如 `daily-check-myself`）
2. 打开 [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)，确认选中刚建的项目，点「启用」
3. 打开 [Google Auth Platform](https://console.cloud.google.com/auth/overview)，点「开始」：
   - 应用名称填「每日成长」，用户支持邮箱选你自己
   - 受众（Audience）选 **External（外部）**
   - 联系邮箱填你自己，同意条款后创建
4. 在 **Audience（受众）** 页面的 **Test users（测试用户）** 中，添加你要用来登录的 Google 邮箱（每台手机用的账号都要加）
5. 在 **Data Access（数据访问）** 页面点「添加或移除范围」，勾选 `.../auth/drive.appdata`，保存
6. 在 **Clients（客户端）** 页面点「创建客户端」：
   - 应用类型选 **Android**
   - 软件包名称：`com.dailycheckmyself.app`
   - SHA-1 证书指纹：`8E:82:1D:6E:D8:2E:84:C8:62:11:E1:47:16:4B:DF:49:80:0A:7B:47`
   - 点「创建」

7. 网页版还需要再建一个客户端：「创建客户端」→ 应用类型选 **Web 应用**，在「已获授权的 JavaScript 来源」里添加 `https://amychin206.github.io`，点「创建」。把显示的「客户端 ID」填到 [`src/config.ts`](src/config.ts) 的 `GOOGLE_WEB_CLIENT_ID`（客户端 ID 不是机密，可以放在代码里）

完成后，在 app 的「我的」页面点「用 Google 账号登录」即可。登录时如果看到「Google 尚未验证此应用」，点「继续」就行，这是因为这个 app 只给你自己用、没有提交 Google 审核。

> 上面的 SHA-1 对应仓库外保存的签名文件。如果换了签名文件，要在第 6 步里更新指纹。

## 开发

```bash
npm install
npx expo start         # 用 Expo Go 预览（Google 同步在 Expo Go 里不可用）
npm run web            # 在浏览器里预览网页版
npm run typecheck
```

## 项目结构

```
app/                   页面（expo-router）
  (tabs)/index.tsx     今日打卡
  (tabs)/stats.tsx     统计
  (tabs)/settings.tsx  同步、提醒、备份
  entry/[section].tsx  单个版面的拍照和日记
src/
  store.tsx            本地数据
  sync.tsx, drive.ts   Google Drive 同步
  auth.ts / auth.web.ts  Google 登录（手机 / 网页）
  backup.ts            导出 / 导入备份
  photos.ts / photos.web.ts  照片存储（手机文件 / 浏览器 IndexedDB）
  reminders.ts         每日提醒
  stats.ts             统计计算
```
