# Poker+ 开发日志 (Dev Log)

> 记录每日与 Claude 协作完成的功能开发与修复，以会话为主线、日期为索引。

---

## 2026-04-02

### 功能开发

#### Bankroll 管理（LedgerScreen）
- 将原「记账」模块改名为「Bankroll 管理」
- 新增 `LocationFilterDropdown` 组件，支持按地址筛选盈亏图表
- 新增「按地址」入口按钮，点击展开 `LocationStatsSheet` 底部弹窗，显示每个地址的盈亏与场次
- 年份筛选与地址筛选独立运作，通过 `useMemo` 联动 `filteredRecords`
- 移除内联地址统计区块，改为弹窗形式

#### 工具页（ToolsScreen）
- 删除「Bankroll管理」旧模块
- 将「胜率计算」模块重命名为「牌桌记账」
- 将「记账」模块重命名为「Bankroll管理」
- 最终工具列表：Bankroll 管理 / 牌桌记账 / Equity 计算

#### 牌桌记账（TableLedgerScreen）—— 新建
依据 PRD 文档构建完整桌面结算工具，主要功能：
- 玩家设置：4–10 人，每手筹码数 + 每手金额，支持 RMB / USD 切换
- 每个玩家一行：`[−] [手数] 手 → [筹码] 码 [盈亏]`
- 实时 P&L 计算：`calcPlayer()` 纯函数，`useMemo` 派生
- 零和校验：`calcSummary()` 检查总买入 == 总 Cashout
- 最小转账算法：`calcTransfers()` 贪心算法，输出最少转账路径
- 玩家行去除数字标码圆圈，输入框改为 `−/+` 按钮
- `hasData` 条件修复：允许手数为 `0`（`!== ''` 而非 `> 0`）
- 盈亏显示修复：平局显示 `+0`，颜色 `text-gray-300`

新增工具文件：
- `src/utils/settlement.js`：`getChipValue` / `calcPlayer` / `calcSummary` / `calcTransfers`

#### Equity 计算（EquityScreen）—— 新建
依据 PRD 文档构建完整 Equity 计算器：
- 2–9 名玩家，默认 2 人，底部「+」按钮增加玩家
- 独立 `CardPickerSheet`：花色 icon 选择（无中文标签）→ 点数选择，已用牌自动灰显
- 自动跳转：选完第 1 张手牌后自动弹出第 2 张选牌窗口
- 公共牌区（Board）置顶，5 个槽位，每张牌可单独删除
- 玩家卡片：可编辑名称，手牌居中显示，结果展开显示 Win% / Tie% / Equity / Pot Odds
- 底部固定「计算 Equity」按钮，计算中显示 Loader2 spinner
- 10,000 次蒙特卡洛模拟（Fisher-Yates 采样 + `pokersolver` Hand.solve）
- 胜率分布条（EquityBar）动画展示所有玩家占比

新增工具文件：
- `src/utils/equity.js`：`calculateEquity()` Monte Carlo 主函数，`cardToKey()` 辅助

依赖：`npm install pokersolver`

### UI 优化与修复

#### EquityScreen 细节调整
- 花色选择界面仅保留 icon，移除中文标签
- 公共牌（Board）模块移至页面最顶部
- 移除玩家数量选择器，改为「添加玩家 +」按钮，支持最多 9 人
- 手牌槽改为 `justify-center`，两张牌更靠近居中
- 玩家右侧加 X 删除按钮（`canRemove && !result` 条件控制）

#### 牌面设计统一
- 所有空牌背统一为红色底 + 白色交叉格纹 SVG（与 `PokerCardMini` 一致）
- 正面牌面改用 `PokerCardMini` 组件直接渲染，rank 左上角 + 花色居中大字
- 公共牌槽移除 F / F / F / T / R 英文标签
- 手牌尺寸调整：`hole` = 58px，`board` = 52px

#### Bug 修复
- 修复选花色时报错：误删 `SUIT_MAP` 常量导致 `CardPickerSheet` 崩溃，已恢复

#### PlayerCard 优化
- 移除玩家名称左侧彩色数字圆圈

### Git 操作
- Commit：`feat: add Bankroll管理, 牌桌记账, Equity计算 modules`（15 个文件，+2669 行）
- Push 至 `friend/lucifer-dev`
- 拉取 `friend/main`（含 favicon 修复）合并后推送，`lucifer-dev` → `main` 合并完成

---

## 2026-03-31

### 功能开发（历史提交，非 Claude 协作）
- 修复 favicon 404（添加 `public/favicon.ico` / `favicon.svg`）
- Merge PR #5：lucifer-dev 分支合并至 main

---

## 2026-03-28 – 2026-03-29

### 功能开发（历史提交，非 Claude 协作）
- V2 模式：Setup 3 步流程、预设公共牌、玩家名称编辑
- PlayScreen：玩家名称内联编辑、行动时间线标注
- 快照导航（前进/后退）、SummaryScreen 行动详情
- PokerCardMini 组件提取、70 个单元测试

---

*文档由 Claude 协助维护，每次对话结束后更新。*
