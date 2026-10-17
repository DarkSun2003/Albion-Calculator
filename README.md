# Albion Artisan — All-in-One Economic & Black Market Suite

An art-directed, high-precision economic calculator suite for **Albion Online** spanning **all 7 major economic disciplines**, powered by a **Django REST Framework** backend and a **React + Vite + Tailwind CSS** frontend.

---

## 📁 Downloaded This Repo? Here Is What Every File Does!

If you downloaded or cloned this repository onto your computer, you will see several launcher files in the main folder. Here is a quick guide to **what each file does** and **which one you should double-click**:

| File Name | What It Does | Who Should Use It? |
| :--- | :--- | :--- |
| **`Albion Desktop App.vbs`** ⭐ | **Silent Native Desktop App Launcher.** Starts the local SQLite backend silently in the background (zero black command prompt windows!), automatically starts your Albion Data Client scanner if installed, opens a standalone borderless app window, and automatically shuts down the server the moment you close the window. | **Recommended for Players!** Use this for everyday gaming if you want a clean, fast, low-RAM desktop app. |
| **`start-albion-local.bat`** 🛠️ | **Developer / Browser Mode Launcher.** Opens two visible terminal windows—one for the Django Backend (`http://127.0.0.1:8000`) and one for the Vite React Dev Server (`http://localhost:5173`)—and opens your regular web browser with live code hot-reloading. *(Automatically creates `.venv` and runs `npm install` on first launch!)* | **For Developers / Modders** who are editing the Python or React code and want to see live terminal logs and instant code updates. |
| **`Setup_Albion_Data_Client.bat`** 📡 | **1-Click Live Market Scanner Installer.** Checks if you have the official open-source **Albion Data Client (ADC)** installed on your PC. If not, it automatically downloads and launches the official installer so your in-game market visits stream real-time `0m ago` prices to the calculator! | **All PC Players** who play Albion Online on Windows and want instant live market prices as they browse the in-game market. |
| **`desktop_app.py`** ⚙️ | **Desktop App Controller Script.** The Python engine called behind the scenes by `Albion Desktop App.vbs`. It manages the local SQLite database migrations, builds the frontend if needed, manages the app window lifecycle, and cleans up background processes on exit. | Called automatically by `Albion Desktop App.vbs` (you don't need to click this directly). |
| **`albion-icon.ico`** 🛡️ | **Custom Royal Forgemaster App Icon.** Multi-resolution Windows icon (`.ico`) featuring the Royal Forgemaster anvil & hammer crest. | Used when creating a Windows Desktop Shortcut for `Albion Desktop App.vbs`. |

---

## 🚀 First-Time Setup (If You Downloaded the Repo)

### 1. Prerequisites
Make sure you have both installed on your computer:
- **Python 3.10+** ([python.org/downloads](https://www.python.org/downloads/) — check *"Add Python to PATH"* during installation)
- **Node.js 18+** ([nodejs.org](https://nodejs.org/))

### 2. Launch the App (Auto-Setup Included!)
- **First Run:** Double-click **`start-albion-local.bat`** (or **`Albion Desktop App.vbs`**). On your very first launch, the launcher will automatically:
  1. Create a local Python virtual environment (`.venv`) and install `backend/requirements.txt`.
  2. Install frontend packages (`npm install`) inside `frontend/`.
  3. Run local SQLite database migrations (`db.sqlite3`).
- **How to Create a Desktop Shortcut with the Custom Icon:**
  1. Right-click **`Albion Desktop App.vbs`** $\rightarrow$ **Send to** $\rightarrow$ **Desktop (create shortcut)**.
  2. Right-click the new shortcut on your Desktop $\rightarrow$ **Properties** $\rightarrow$ **Change Icon...**
  3. Select **`albion-icon.ico`** inside this project folder and click **OK**!

---

## 🌟 All 7 Economic Calculators Included

1. **💎 Refining Workshop:**
   - Exact Resource Return Rate (RRR) formulas across all 6 Royal Cities (`36.7%` base specialty bonus, `53.9%` with Focus) and Personal/Guild Islands.
   - Verified special Stone mechanics (`.1 → 2×`, `.2 → 4×`, `.3 → 8×` flat blocks).
   - 6-City Cross-Market Arbitrage & Optimal Transport Haul advisor.
2. **⚔️ Gear & Weapon Forgemaster (3,400+ Items):**
   - Two-phase **Pre-Craft Shopping List** & **Post-Craft Quality Realized Ledger**.
   - Kraken/Crafter's Salad quality buff simulation, Discrete Quality Dice Simulator, and Crafting Journal profit integration.
3. **🍲 The Master Chef's Hearth (Cooking & Butchery):**
   - Caerleon `+15%` local cooking bonus (`24.8%` base / `53.9%` Focus RRR), Fish Sauce enchantment infusions (`.1`–`.3`), and multi-ingredient batch yields.
4. **🧪 The Alchemist's Laboratory (Potions & Distillery):**
   - Brecilien & Caerleon `+15%` alchemy bonus, Arcane Extract infusions, and Silver-per-Focus (SPF) optimization.
5. **🌾 The Agrarian Homestead (Farming, Herbs & Livestock):**
   - Infinite Seed Loop (`>100%` seed return with Focus watering), Livestock Milk/Egg vs. Butcher Slaughter comparison, and Mount raising.
6. **👷 Guild Hall & Island Laborers:**
   - 11 Laborer professions (T2–T8), `150%` Happiness furniture/trophy calculator, and Filled vs. Empty Journal return economics.
7. **💀 Caerleon Black Market Arbitrage & Transport Scanner:**
   - Strict **Quality-Matched Arbitrage (`Q1–Q5`)** comparing Royal City sell orders and bonus-city crafting costs against Caerleon NPC Buy Orders & Sell Orders.
   - **Live Price Age Badges (`🟢 Updated Xm ago`, `🟡 Updated Xh ago`, `🔴 Updated Xh ago`)**, **Max Price Age** filter, **`⚡ Auto-Fetch: ON`** toggle, and Haul Cargo Weight / Mount risk calculator.

---

## 🛡️ 3-Layer Verified Market Engine + Automatic Internet Clock Calibration

- **Layer 1 — Strict Timestamp & Quality Filtering:** Prevents stale orders from overwriting newer scans and enforces `qualities=1` on non-equipment commodities.
- **Layer 2 — 24-Hour Traded History Outlier Guard (`📊 24h Traded Avg`):** Cross-checks spot orders against `/stats/history/` 24h traded averages to reject manipulated `9,999,999` silver listings.
- **Layer 3 — Shared Community Database (`MarketPriceSnapshot`):** Whenever any player fetches fresh prices, verified snapshots are saved to the shared database for all desktop and mobile visitors.
- **Automatic Internet Clock Calibration:** Automatically calibrates both backend and browser timestamps against the remote AODP server's UTC clock so price ages are 100% accurate even if a user's system clock/date is out of sync.
