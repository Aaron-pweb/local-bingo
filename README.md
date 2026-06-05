# Local Bingo

A full-stack, real-time Bingo game application designed for local hosting. Features a centralized caller dashboard, live display for players, and automatic card verification.

## 🚀 Features

- **Real-time Synchronization:** Uses WebSockets (Socket.io) to sync called numbers and game status across all clients instantly.
- **Caller Dashboard:** Secure interface for managing game flow, calling numbers, and changing win patterns.
- **Live Display:** Clean, high-visibility interface for players to see called numbers and the current pattern.
- **Card Verification:** API-based verification to instantly check if a card ID has won based on the current called numbers.
- **Persistent State:** Game state is saved to a local SQLite database, allowing recovery if the server restarts.

## 🛠 Tech Stack

- **Backend:** Python, Flask, Flask-SocketIO, SQLite
- **Frontend:** React, Vite, Socket.io-client
- **Data:** Custom JSON-based Bingo card generator

---

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **npm** (usually comes with Node.js)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone git@github.com:Aaron-pweb/local-bingo.git
cd local-bingo
```

### 2. Backend Setup
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Generate Bingo Cards
The system needs a set of cards to verify winners.
```bash
python data/generate_cards.py
```
*This will create `data/cards.json`.*

### 4. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## 🏃‍♂️ Running the Application

### Development Mode (Recommended for testing)

1. **Start the Backend:**
   ```bash
   # From the root directory
   python backend/app.py
   ```
   The backend will run on `http://localhost:5000`. It will also automatically create a `.env` file in the `backend/` folder with a default password (`admin123`).

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

### Production Mode (Single Server)

If you want the Flask server to serve the frontend:
1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
2. **Run the backend:**
   ```bash
   python backend/app.py
   ```
   Now visit `http://localhost:5000` to see the application.

---

## 🎮 How to Play

1. **Login:** Access the `/login` route. Use the password found in `backend/.env` (default: `admin123`).
2. **Caller Dashboard:** Once logged in, you can start the game, set the pattern (e.g., "Full House", "Straight Line"), and call numbers as they are drawn.
3. **Display Screen:** Open `http://localhost:5173/display` (or `http://localhost:5000/display` in production) on a large screen/TV for all players to see.
4. **Verification:** In the Caller Dashboard, enter a Card ID to verify if that card is a winner according to the current pattern and called numbers.

---

## 📁 Project Structure

```
local-bingo/
├── backend/            # Flask server, Socket.io, and DB logic
├── frontend/           # React application (Vite)
│   ├── src/pages/      # Login, CallerDashboard, and Display screens
├── data/               # Bingo card generation scripts and data
└── README.md           # You are here!
```

## 🔒 Security
- You can change the `CALLER_PASSWORD` in `backend/.env` after the first run.
- The `.env` and `bingo.db` files are ignored by Git to keep your credentials and local data safe.
