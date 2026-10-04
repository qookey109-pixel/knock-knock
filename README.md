# Knock Knock

七個輕鬆的腦力小遊戲：快速心算、瞬間記憶、邏輯推理、規則切換、舒爾特方格、Stroop、表裡不一。

[玩 Knock Knock](https://qookey109-pixel.github.io/quick-math-brain-training/adult-brain-training/) · [原版快速心算](https://qookey109-pixel.github.io/quick-math-brain-training/)

- 每關最高五顆星，沿用原本答題分數換算；七關回顧分別呈現各關星等。0 分不亮星，1–39／40–59／60–74／75–89／90–100 分分別為一至五星。
- 結尾回顧遊玩時間與各關活動，答題細節可自行展開。
- 隨時暫停，離開分頁自動暫停；回來後手動繼續。
- 最近遊玩紀錄、音樂與音效偏好只儲存在目前瀏覽器。
- 手機觸控、電腦鍵盤、減少動態效果、免登入。

## 關卡設定

記憶看 6 秒、作答不限時、最多 9 位數；8 位數排 4＋4，9 位數排 5＋4。推理不限時、點選直接換題，每次 10 題包含 8 種題型。心算全程兩個數，每級 60 秒、答對 8 題升級。舒爾特只有 1→50 與 50→1，答對數字保留原格並停止飄動，其餘數字在每次答對後重新換位並換色。

## 開發與驗收

純 HTML / CSS / JavaScript。GitHub Actions 執行邏輯、手機／桌面瀏覽器、無障礙與 Lighthouse QA，包含完整七關、暫停計時、五星評等及紀錄持久化驗收。

娛樂與練習用途，不作 IQ、醫療或認知功能診斷。

轉場採 200ms 小幅位移，文字保持清楚，支援減少動態效果；換頁聚焦標題。關間可提早收尾並保留已完成星等，七關回顧可單獨重玩任一已玩關卡。

手機遊玩區使用可用視窗高度，減少上方空間與切關捲動。瞬間記憶內建數字鍵盤自動出現，支援實體鍵盤、清除、刪除與保留前導零。

關間只顯示星等與下一關，詳細統計集中在最後回顧。BGM 與音效有獨立開關、獨立音量，遊玩中可調整並保存在瀏覽器。


## Flow updates

Each game shows its rules before a first play on the current browser. Exiting a live game opens a recap so completed ratings are preserved; the pause sheet also offers an early finish. Daily Training saves completed games locally and can resume at the next game after a reload; an unfinished game restarts from its beginning. Result screens return directly to the game selector. Accuracy, errors, streaks, and reaction times appear in the recap, while live play keeps only the controls and game progress needed to continue.
