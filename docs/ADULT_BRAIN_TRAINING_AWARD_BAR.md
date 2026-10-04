# Adult Brain Training — Award Submission Bar

The target is not a generic utility page. The target is a compact, authored browser game that can be presented in a game-design portfolio or submitted to an appropriate web/game/design competition.

## Product identity

The experience should feel like one game made of seven distinct training challenges, not seven unrelated demos.

Current independent games:

1. 快速心算
2. 瞬間記憶
3. 邏輯推理
4. 規則切換
5. 舒爾特方格
6. Stroop 顏色衝突
7. 表裡不一

Daily Training runs all seven games as one complete session.

## Judging pillars

### 1. Core game feel
Inputs must feel immediate. Correct/incorrect feedback must be understandable without slowing the player. Repeated play should have rhythm.

### 2. Original product framing
The project may use established cognitive-task patterns, but presentation, pacing, completion rituals, progression, audiovisual language, and combination into a daily ritual should form a distinct authored product.

### 3. Visual system
Typography, spacing, cards, game HUD, five-star rating presentation, states, motion, and sound should share one design language.

### 4. Difficulty design
Difficulty should grow through cognitive load, interference, dependency, and time pressure—not only larger numbers or more content.

### 5. Replayability
Each mode should support variation. Daily Training should feel fresh without requiring an account.

### 6. Clarity and accessibility
Mobile-first controls, keyboard support where appropriate, strong contrast, large touch targets, reduced-motion support, and no diagnostic/medical claims.

### 7. Technical craft
No broken flows, no ambiguous logic puzzles, no horizontal overflow, no serious/critical accessibility violations, strong Lighthouse results, and deterministic cloud QA.

## Submission-ready definition

A version is submission-ready only when:

- all seven games have complete start → play → result loops;
- Daily Training can complete all seven games end-to-end;
- each game shows five star slots, rated using its original 0–100 scoring formula;
- recaps foreground stars and descriptive statistics; numeric scores appear only in optional details;
- timers and delayed callbacks freeze during pauses and stop on exit;
- animation and sound are cohesive rather than decorative;
- mobile and desktop browser QA pass;
- accessibility QA passes;
- Lighthouse median thresholds pass;
- GitHub Pages deploy succeeds for the same latest SHA;
- there are no known blocker bugs;
- the public page has an intentional title, description, icon/identity, and a polished first-session experience.


## Chill direction — 2026-10-03

The user requests a relaxing game rather than a scored test. The latest user correction requires up to five stars per game based on answer score. Preserve the original per-mode scoring formulas. Score thresholds: 0 = no lit stars; 1–39 = one; 40–59 = two; 60–74 = three; 75–89 = four; 90–100 = five. Every result has five slots. Ending early is explicitly unrated. The seven-game recap shows each game separately; it does not assign an overall grade. Legacy completion-only history remains labelled as legacy, never reinterpreted as a rating.

Memory exposure 6s, untimed answering, max 9 digits; logic untimed with direct choice submission and no answer explanations; Schulte A/B only with 50 visible slots and stronger drift; completed numbers stay pinned while unfinished numbers reshuffle after each correct hit. Pause is available across all games and on hidden tabs.

Primary recaps show play time and activity; descriptive answer details are optional. Browser-only play history has no leaderboard, personal best ranking, streak pressure, or account requirement. Explicit preview selection must survive hover/focus changes. Music and effects have separate persisted volume controls. Repeat game entry uses shorter motion.

## Mobile flow update — 2026-10-03 23:12 Asia/Taipei

The latest user instruction supersedes the previous all-number fixed-order rule: only completed Schulte numbers are pinned; unfinished numbers change positions after each correct answer. All 50 slots remain visible. Phone gameplay uses the dynamic viewport height; memory uses an automatically revealed in-page numeric keypad, without requiring the OS keyboard. Preserve 6s exposure, untimed answering, max 9 digits, and the existing star formulas. Verify all seven game controls fit at 375×667 and 390×844. Extremely short landscape viewports may scroll inside the game panel to preserve access.

## Flow rules — 2026-10-03 23:42 Asia/Taipei

Latest explicit instruction: math is easier and always two operands; keep the 60s per-level reset. Memory exposure is 6s and answering untimed; retain 900ms feedback. Render 8 digits as 4+4 and 9 as 5+4. Logic is untimed and clicking a choice submits directly, with 8 types across each 10-question session. Schulte unfinished targets change colors as well as positions. Stroop yellow is bright #ffdf00 on a dark readable backdrop. Between-game screens show stars and next action; details stay in final recaps. Music and effects have separate persisted mute switches and volumes available during play.

## 首頁入口整理

移除沒有文字的七色色塊。遊戲卡片保留直接開始，加上「開始玩」文字；預覽面板使用原生、有標籤的七關選單，切換玩法不會開始計時。選單保留瀏覽器鍵盤操作，面板本身仍可左右鍵與滑動切換。參考 AI Resource Hub 收錄的 UI Skills（https://github.com/ibelick/ui-skills/blob/main/skills/baseline-ui/SKILL.md），採用既有元件與清楚操作入口，保留目前品牌配色。
