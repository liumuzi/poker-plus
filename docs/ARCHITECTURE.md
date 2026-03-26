# Poker+ 架构文档 (Architecture Documentation)

> **⚠️ 维护须知：所有 AI agent 和开发者在修改代码时必须同步更新本文档。**
> 详见 `.github/instructions/copilot_instructions.instructions.md`。

---

## 一、项目概览

Poker+ 是一款德州扑克「错题本」App（移动端优先），用于牌局复盘与记录。
技术栈：React 18 + Vite 5 + TailwindCSS 3 + Framer Motion 11。

---

## 二、目录结构

```
poker-demo/src/
├── App.jsx                         # 应用根组件，仅负责页面路由切换
├── main.jsx                        # React 入口，挂载 App
├── index.css                       # 全局样式 (Tailwind directives + reset)
│
├── constants/                      # 🔵 纯数据常量
│   └── poker.js                    # SUITS, RANKS, ROUND_NAMES, getPositions()
│
├── engine/                         # 🟢 纯函数游戏引擎（零 React 依赖）
│   ├── gameEngine.js               # 核心状态机：处理行动、判断轮次结束、翻牌过渡
│   │                               # 包含 V2 模式函数：createInitialPlayersV2
│   ├── cardUtils.js                # 卡牌相关纯函数：isCardUsed, 牌面格式化数据
│   └── snapshotUtils.js            # 快照创建与恢复
│
├── contexts/                       # 🟡 React 全局状态
│   └── GameContext.jsx             # useReducer 管理游戏状态 + Provider + useGame hook
│                                   # 包含 V2 模式 actions 和状态字段
│
├── hooks/                          # 🟠 自定义 Hooks
│   ├── useDragScroll.js            # 可拖拽滚动行为
│   └── useSavedGames.js            # localStorage 存档 CRUD
│
├── components/                     # 🔴 可复用 UI 组件
│   ├── CardDisplay.jsx             # 单张卡牌渲染
│   ├── CardPicker.jsx              # 选牌弹窗（底牌/公共牌/补录）
│   ├── SwipeCard.jsx               # 行动卡片（含滑动手势 + 加注面板）
│   ├── PlayerBadge.jsx             # 玩家状态标签
│   ├── HorizontalTableDiagram.jsx  # 🆕 V2 横向桌面示意图（入池人数可视化）
│   └── StageNavigation.jsx         # 🆕 V2 节点流程导航（配置→preflop→flop→turn→river）
│
├── screens/                        # 🟣 页面级组件
│   ├── HomeScreen.jsx              # 首页：新建牌局 + 存档列表 + V2模式入口
│   ├── SetupScreen.jsx             # 配置页(V1)：人数、盲注、Hero位置、底牌
│   ├── SetupScreenV2.jsx           # 🆕 配置页(V2)：入池人数→Hero位置→公共牌→盲注
│   ├── PlayScreen.jsx              # 牌桌页：行动卡片 + 顶部状态 + 底部玩家条 + V2节点导航
│   ├── ResolutionScreen.jsx        # 结算页：选赢家 + 补录亮牌
│   └── SummaryScreen.jsx           # 复盘页：时间线式牌局回放 + V2玩家编辑/备注功能
│
└── utils/                          # ⚪ 通用工具
    └── formatting.js               # 行动文本解析 (parseAction) 等格式化工具
```

---

## 三、数据流架构

```
用户交互 (UI Event)
    │
    ▼
Screen / Component
    │  调用 dispatch(action)
    ▼
GameContext (useReducer)
    │  根据 action.type 调用对应 engine 纯函数
    ▼
engine/* (纯函数)
    │  接收 prevState → 返回 newState
    ▼
GameContext 更新 state
    │
    ▼
React 重新渲染受影响的组件
```

### 关键原则
- **UI 层不直接修改游戏状态**，一律通过 `dispatch` 触发。
- **engine 层是纯函数**，输入旧状态 → 输出新状态，完全无副作用。
- **Context 是唯一的状态源**，各 Screen 通过 `useGame()` hook 获取状态和 dispatch。

---

## 四、核心模块 API

### 4.1 `constants/poker.js`

```js
export const SUITS = [
  { s: '♠', id: 's', color: 'text-slate-800' },
  { s: '♥', id: 'h', color: 'text-red-500' },
  { s: '♣', id: 'c', color: 'text-slate-800' },
  { s: '♦', id: 'd', color: 'text-red-500' },
];

export const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];

export const ROUND_NAMES = [
  '翻前 (Pre-flop)', '翻牌 (Flop)', '转牌 (Turn)',
  '河牌 (River)', '比牌 (Showdown)'
];

export function getPositions(count) → string[]
// 根据人数返回位置名称数组
```

### 4.2 `engine/gameEngine.js`

```js
// 创建初始玩家列表 (V1 模式，预设 SB/BB)
export function createInitialPlayers(playerCount, heroIndex, heroCards, sbAmount, bbAmount)
  → { players, potSize, highestBet, history }

// 🆕 创建初始玩家列表 (V2 模式，不预设盲注，玩家命名为 BTN/玩家1/玩家2.../Hero)
export function createInitialPlayersV2(playerCount, heroIndex, heroCards, customNames)
  → { players, potSize: 0, highestBet: 0, history: [] }

// 处理玩家行动（纯函数）
export function processAction(gameState, actionStr, amount)
  → { players, potSize, highestBet, historyEntry } | null
// actionStr 支持: 'Fold' | 'Check/Call' | 'Bet' | 'Raise' | 'All-in'

// 检查当前轮次是否结束
export function checkRoundEnd(players, highestBet, bettingRound, playerCount)
  → { ended: boolean, reason: 'next_street'|'resolution'|null, nextStreet: 'flop'|'turn'|'river'|null }

// 过渡到下一条街
export function transitionToNextStreet(gameState, cardsAdded)
  → { players, communityCards, bettingRound, highestBet, historyEntry, nextAction }

// 找到下一个需要行动的玩家
export function findNextActor(currentIdx, players)
  → number | null  // 返回玩家索引，或 null 表示无人可行动
```

### 4.3 `engine/cardUtils.js`

```js
// 判断一张牌是否已被使用
export function isCardUsed(rank, suitId, heroCards, communityCards, tempCards, players)
  → boolean

// 获取卡牌的显示数据（花色符号、颜色类名等）
export function getCardDisplayData(card)
  → { symbol, rank, colorClass } | null
```

### 4.4 `engine/snapshotUtils.js`

```js
// 创建当前游戏状态的深拷贝快照
export function createSnapshot(gameState)
  → snapshot object

// 从快照恢复状态
export function restoreSnapshot(snapshot)
  → gameState object
```

### 4.5 `contexts/GameContext.jsx`

```jsx
// Provider 组件
export function GameProvider({ children })

// 消费 hook
export function useGame()
  → {
    // ---- 状态 ----
    stage,              // 'home' | 'setup' | 'setupV2' | 'play' | 'resolution' | 'summary'
    playerCount,        // number
    sbAmount, bbAmount, // number
    heroIndex,          // number
    heroCards,          // [Card|null, Card|null]
    players,            // Player[]
    currentTurn,        // number
    history,            // HistoryEntry[]
    communityCards,     // Card[]
    bettingRound,       // 0-3
    highestBet,         // number
    potSize,            // number
    winners,            // number[]
    pickingCardsTarget, // string|null
    tempCards,          // Card[]
    isViewingSave,      // boolean
    
    // ---- 🆕 V2 模式状态 ----
    isV2Mode,           // boolean - 是否为V2模式
    playerNames,        // { [playerId]: string } - 玩家自定义名称
    playerStacks,       // { [playerId]: number } - 玩家后手筹码
    gameNotes,          // string - 复盘备注
    actionStage,        // 'setup'|'preflop'|'flop'|'turn'|'river' - 当前行动阶段

    // ---- 操作 ----
    dispatch,           // React dispatch function
  }
```

**Action Types:**

| type | payload | 说明 |
|------|---------|------|
| `SET_STAGE` | `{ stage }` | 切换页面 |
| `SET_PLAYER_COUNT` | `{ count }` | 设置人数 (V1模式，heroIndex自动设为最后) |
| `SET_PLAYER_COUNT_V2` | `{ count }` | 🆕 设置入池人数 (V2模式，heroIndex保持不变) |
| `SET_BLINDS` | `{ sb, bb }` | 设置盲注 |
| `SET_HERO_INDEX` | `{ index }` | 设置 Hero 位置 |
| `SET_HERO_CARD` | `{ position, card }` | 设置 Hero 底牌 |
| `START_GAME` | - | 初始化并进入牌局 (V1模式，预设SB/BB) |
| `START_GAME_V2` | - | 🆕 初始化并进入牌局 (V2模式，不预设盲注) |
| `PLAYER_ACTION` | `{ action, amount }` | 执行玩家行动（含 Bet/Raise 区分） |
| `UNDO` | - | 撤销上一步 |
| `EXIT_TO_HOME` | - | 中途放弃当前牌局并返回主菜单 |
| `REWRITE_FROM_CURRENT_HAND` | - | 从复盘页回到记录界面并预填写基础参数后重写 |
| `SET_PICKING_TARGET` | `{ target }` | 打开/关闭选牌弹窗 |
| `SELECT_CARD` | `{ card }` | 在选牌弹窗中选中一张牌 |
| `TRANSITION_STREET` | `{ cards }` | 公共牌发出，过渡到下一轮 |
| `TOGGLE_WINNER` | `{ playerId }` | 勾选/取消赢家 |
| `FINISH_HAND` | - | 最终结算 |
| `REVEAL_PLAYER_CARD` | `{ playerIdx, cardPos, card }` | 补录玩家亮牌 |
| `LOAD_SAVED_GAME` | `{ game }` | 加载存档 |
| `RESET_FOR_NEW_GAME` | - | 重置所有状态 (V1模式) |
| `RESET_FOR_NEW_GAME_V2` | - | 🆕 重置所有状态 (V2模式) |
| `UPDATE_PLAYER_NAME` | `{ playerId, name }` | 🆕 更新玩家名称 |
| `UPDATE_PLAYER_STACK` | `{ playerId, stack }` | 🆕 更新玩家后手筹码 |
| `UPDATE_GAME_NOTES` | `{ notes }` | 🆕 更新复盘备注 |
| `NAVIGATE_TO_STAGE` | `{ stage }` | 🆕 导航到指定阶段（用于节点流程导航） |

### 4.6 `hooks/useDragScroll.js`

```js
export function useDragScroll()
  → { scrollRef, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove }
// 为容器提供鼠标拖拽滚动能力
```

### 4.7 `hooks/useSavedGames.js`

```js
export function useSavedGames()
  → {
    savedGames,               // SavedGame[]
    saveGame(gameData),       // 保存新存档
    deleteGame(id),           // 删除存档
    loadGame(game),           // 加载存档（返回数据，不直接修改 context）
  }
```

### 4.8 `utils/formatting.js`

```js
// 将内部 action 字符串转为中文展示数组
export function parseAction(actionStr) → string[]
// 例: 'Raise to 8' → ['加注', '$8']
// 例: 'Bet 12' → ['下注', '$12']
```

### 4.9 行动面板定注规则

- `highestBet === 0`：显示 `Bet`，定注快捷比例按底池计算：`1/3`、`1/2`、`2/3`、`满池`。
- `highestBet > 0`：显示 `Raise`，定注快捷比例按“跟注后底池”计算到 `Raise To` 金额：`1/3`、`1/2`、`2/3`、`满池`。
- 两种模式均提供：`All-in` 与 `自定义输入`。

### 4.10 复盘页增强能力

- 支持“回到记录界面重写本手”：从 `SummaryScreen` 一键跳回 `SetupScreen`，并预填写人数、盲注、Hero 位置与 Hero 底牌，用户可从头重新记录。
- 支持展示 Hero 总览：`本手结果(盈亏)`、`Hero投入`、`已发公共牌数量`。
- 各条街公共牌采用“累计展示”方式：
  - Flop 展示 Flop 三张
  - Turn 展示 Flop+Turn 四张
  - River 展示 Flop+Turn+River 五张

---

## 五、组件树

```
<App>
  ├── <GameProvider>
  │   ├── <HomeScreen />              (stage === 'home')
  │   ├── <SetupScreen />             (stage === 'setup', V1模式)
  │   │   └── <CardPicker />
  │   ├── <SetupScreenV2 />           (stage === 'setupV2', 🆕 V2模式)
  │   │   ├── <HorizontalTableDiagram />
  │   │   └── <CardPicker />
  │   ├── <PlayScreen />              (stage === 'play')
  │   │   ├── <StageNavigation />     (🆕 仅V2模式显示)
  │   │   ├── <SwipeCard />
  │   │   ├── <PlayerBadge />×N
  │   │   └── <CardPicker />
  │   ├── <ResolutionScreen />        (stage === 'resolution')
  │   │   └── <CardPicker />
  │   └── <SummaryScreen />           (stage === 'summary')
```

---

## 六、数据模型

### Card
```js
{ rank: string, suit: string }  // e.g. { rank: 'A', suit: 's' }
```

### Player
```js
{
  id: number,
  name: string,           // 位置名 or 自定义名 (V2模式: BTN/玩家1/玩家2.../Hero)
  folded: boolean,
  allIn: boolean,
  betThisRound: number,
  totalInvested: number,
  actedThisRound: boolean,
  isHero: boolean,
  knownCards: [Card|null, Card|null],
  stackSize: number,      // 🆕 V2模式：后手筹码
}
```

### HistoryEntry
```js
// 行动记录
{ player: string, action: string, round: string, pot: number, isHero: boolean }
// 分割线
{ isDivider: true, text: string, cards: Card[] }
// 赢家记录
{ player: string, action: string, isWinLog: true }
```

### SavedGame
```js
{
  id: number,         // Date.now() 时间戳
  date: string,       // 本地化日期字符串
  potSize: number,
  history: HistoryEntry[],
  players: Player[],  // 仅 hero 或有已知手牌的玩家
  communityCards: Card[],
  sbAmount: number,
  bbAmount: number,
  // 🆕 V2 模式新增字段
  isV2Mode: boolean,
  gameNotes: string,
  playerStacks: { [playerId]: number },
}
```

---

## 七、页面流转

### V1 模式（传统流程）
```
[HomeScreen] ──新建牌局──▶ [SetupScreen] ──进入桌台──▶ [PlayScreen]
                                                         │
                                                    轮次结束 / 只剩1人
                                                         │
                                                         ▼
                                                  [ResolutionScreen]
                                                         │
                                                      确认/跳过
                                                         │
                                                         ▼
[HomeScreen] ◀──保存/返回──  [SummaryScreen]

[HomeScreen] ──加载存档──▶ [SummaryScreen] (只读模式)
```

### 🆕 V2 模式（入池配置流程）
```
[HomeScreen] ──新模式入口──▶ [SetupScreenV2]
                              │
                     Step 1: 选择Flop入池人数
                     Step 2: 选择Hero位置（桌面示意图）
                     Step 3: 录入公共牌（可选）
                     Step 4: 设定盲注
                              │
                              ▼
                          [PlayScreen]（含节点导航）
                              │
                    ┌─────────┴─────────┐
                    │                   │
              点击已完成节点      正常行动流程
                    │                   │
                    ▼                   ▼
           返回对应阶段修改    [ResolutionScreen]
                                        │
                                        ▼
                              [SummaryScreen]
                           （含玩家编辑/备注功能）
```

**V2 模式特点：**
- 玩家命名为 BTN、玩家1、玩家2...、Hero（而非位置名）
- 不预设 SB/BB 玩家
- 顶部节点导航：入池配置 → preflop → flop → turn → river
- 支持点击已完成节点返回修改
- 复盘页支持编辑玩家名称、后手筹码、添加备注

### 首页历史卡片摘要

- 在未进入历史详情前，`HomeScreen` 的每条存档卡片会直接展示：
  - `净值`（单一字段，正数代表盈利，负数代表亏损）
  - `已发公共牌`（按当前已知公共牌数组显示）
- 卡片边框按盈亏着色：
  - 盈利：绿色边框
  - 亏损：红色边框
  - 持平：灰色边框
- 卡片采用紧凑布局，删除盲注/玩家列表/底池等非关键摘要信息，以提升同屏记录数量。
- 该摘要用于快速筛选牌局，不影响点击后进入 `SummaryScreen` 的完整复盘数据。

---

## 八、扩展须知

### 新增页面
1. 在 `src/screens/` 创建 `XxxScreen.jsx`。
2. 在 `GameContext` 的 `stage` 类型中增加新值。
3. 在 `App.jsx` 中增加对应的条件渲染。
4. 更新本文档的目录结构与页面流转图。

### 新增游戏逻辑
1. 在 `src/engine/` 中以纯函数方式实现。
2. 在 `GameContext` reducer 中新增 action type 来调用该函数。
3. 更新本文档的 API 说明和 Action Types 表。

### 新增 UI 组件
1. 在 `src/components/` 创建组件，保持无副作用（通过 props/callbacks 通信）。
2. 更新本文档的组件树。
