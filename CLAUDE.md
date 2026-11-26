# 給在這個專案工作的 AI 助手

**海佃地圖**（geo.twranger.com）：康軒五上社會的補充互動網頁，地圖與真實資料為主，給國小五年級學生和上課投影用。

**動手前先讀完下面這份共用規範**（twranger 全部網站都遵守同一份）：

@WEB-STANDARDS.md

這個專案已經有 `DESIGN.md`（2026-11-13 確認）。三份有衝突時：`DESIGN.md` ＞ `WEB-STANDARDS.md` ＞ 你的習慣。

## 這個專案怎麼運作

- 純靜態網站，沒有建置步驟：根目錄的 `.html` 就是上線的檔案，共用的導覽與樣式在 `assets/`（`site-nav.js`、`site-nav.css`、`site.css`）。部署在 GitHub Pages（`CNAME`）。
- `data/` 的資料由 GitHub Actions 定時跑 `scripts/` 更新（地震、發電、水庫等）。**這些資料檔是產生出來的，不要手動改**；要改就改 `scripts/` 裡對應的程式。
- 每次改到 `*.html` 或 `assets/`，`.github/workflows/impeccable.yml` 會自動用最新版 Impeccable 掃描，結果在 `audit` 分支；改完去看有沒有新問題。
- 本機預覽：在專案根目錄跑 `python3 -m http.server 8000`。

## 上線基本功還缺的（2026-11-26 用 Impeccable 4.11.1 檢查，尚未逐項人工確認）

網站圖示、分享預覽圖、README（目前只有標題，沒有本機執行說明）、部分文字對比；有單檔超過 1,000 行的頁面，新增功能時不要再往裡面加，拆成獨立檔。改到相關地方時順手補上。

## 和其他對話串協調

對話串之間不能直接傳訊息。做了會影響別人的決定就寫進這一頁；合併前先把 `origin/main` 併進自己的分支再測一次。
推到 `main` 就會直接上線（GitHub Pages），所以合併等於部署：要等使用者明確說「合併」。
