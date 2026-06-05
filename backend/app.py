import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO
from dotenv import load_dotenv

# Path configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
DATA_DIR = os.path.join(BASE_DIR, 'data')
FRONTEND_BUILD_DIR = os.path.join(BASE_DIR, 'frontend', 'dist')
ENV_FILE = os.path.join(BACKEND_DIR, '.env')

# Auto-generate .env if not exists
if not os.path.exists(ENV_FILE):
    with open(ENV_FILE, 'w') as f:
        f.write("CALLER_PASSWORD=admin123\n")
    print(f"Created default .env at {ENV_FILE}")

load_dotenv(ENV_FILE)
CALLER_PASSWORD = os.getenv("CALLER_PASSWORD", "admin123")

# Initialize Flask and SocketIO
app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database Integration
from database import init_db, load_game_state, update_status, update_pattern, add_called_number, remove_called_number, reset_game as db_reset_game
init_db()

# State
loaded_status, loaded_pattern, loaded_numbers = load_game_state()
called_numbers = loaded_numbers # keep as list to preserve chronological order for the client
current_pattern = loaded_pattern
game_status = loaded_status
global_theme = "light"

cards = {}

# Load cards
CARDS_FILE = os.path.join(DATA_DIR, 'bingo-card.json')
if os.path.exists(CARDS_FILE):
    with open(CARDS_FILE, 'r') as f:
        raw_cards = json.load(f)
        for rc in raw_cards:
            cid = str(rc.get('cartela_no'))
            nums = rc.get('bingo_numbers')
            if nums and len(nums) == 24:
                cards[cid] = {
                    "B": [nums[0], nums[5], nums[10], nums[14], nums[19]],
                    "I": [nums[1], nums[6], nums[11], nums[15], nums[20]],
                    "N": [nums[2], nums[7], "FREE", nums[16], nums[21]],
                    "G": [nums[3], nums[8], nums[12], nums[17], nums[22]],
                    "O": [nums[4], nums[9], nums[13], nums[18], nums[23]]
                }
    print(f"Loaded and converted {len(cards)} cards from {CARDS_FILE}")
else:
    print(f"WARNING: {CARDS_FILE} not found.")

from bingo_logic import check_pattern

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if data and data.get('password') == CALLER_PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid password"}), 401

@app.route('/api/verify', methods=['POST'])
def verify_card():
    data = request.json
    card_id = data.get('card_id')
    pattern = data.get('pattern')
    
    if not card_id or not pattern:
        return jsonify({"success": False, "message": "Missing card_id or pattern"}), 400
        
    if card_id not in cards:
        return jsonify({"success": False, "message": "Card ID not found"}), 404
        
    is_winner = check_pattern(cards[card_id], set(called_numbers), pattern)
    
    socketio.emit('show_verification', {
        'card_id': card_id,
        'is_winner': is_winner,
        'card_data': cards[card_id]
    })
    
    return jsonify({
        "success": True,
        "is_winner": is_winner,
        "card_id": card_id,
        "pattern": pattern
    })

def emit_state():
    socketio.emit('state_sync', {
        'called_numbers': called_numbers, 
        'current_pattern': current_pattern,
        'game_status': game_status
    })

@socketio.on('connect')
def handle_connect(auth=None):
    print("Client connected")
    emit_state()
    socketio.emit('theme_sync', {'theme': global_theme})

@socketio.on('set_theme')
def handle_set_theme(data):
    global global_theme
    global_theme = data.get('theme', 'light')
    socketio.emit('theme_sync', {'theme': global_theme})

@socketio.on('start_game')
def handle_start_game():
    global game_status
    game_status = "active"
    update_status("active")
    print("Game started!")
    emit_state()

@socketio.on('call_number')
def handle_call_number(data):
    if game_status != "active": return
    number = int(data.get('number'))
    if number not in called_numbers and 1 <= number <= 75:
        called_numbers.append(number)
        add_called_number(number)
        print(f"Number called: {number}")
        socketio.emit('number_called', {'number': number})

@socketio.on('remove_number')
def handle_remove_number(data):
    number = int(data.get('number'))
    if number in called_numbers:
        called_numbers.remove(number)
        remove_called_number(number)
        print(f"Number removed: {number}")
        socketio.emit('number_removed', {'number': number})

@socketio.on('hide_verification')
def handle_hide_verification():
    socketio.emit('hide_verification')

@socketio.on('reset_game')
def handle_reset_game():
    global game_status, current_pattern
    called_numbers.clear()
    game_status = "waiting"
    db_reset_game(current_pattern)
    print("Game reset")
    emit_state()

VALID_PATTERNS = ["straight_line", "four_corners", "full_house", "letter_x", "letter_t", "letter_l", "cross", "postage_stamp"]

@socketio.on('set_pattern')
def handle_set_pattern(data):
    global current_pattern
    pattern = data.get('pattern')
    if pattern in VALID_PATTERNS:
        current_pattern = pattern
        update_pattern(pattern)
        print(f"Pattern changed to: {current_pattern}")
        emit_state()

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if app.static_folder and os.path.exists(app.static_folder) and path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        return "React frontend is not built yet. Please build it first."

if __name__ == '__main__':
    print("Starting Local Bingo server on http://127.0.0.1:5000")
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)
