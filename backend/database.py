import sqlite3
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bingo.db')

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS game_state (
            id INTEGER PRIMARY KEY,
            status TEXT NOT NULL,
            pattern TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS called_numbers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number INTEGER NOT NULL UNIQUE,
            called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Initialize game_state if empty
    c.execute('SELECT COUNT(*) FROM game_state')
    if c.fetchone()[0] == 0:
        c.execute('INSERT INTO game_state (id, status, pattern) VALUES (1, "waiting", "straight_line")')
        
    conn.commit()
    conn.close()

def load_game_state():
    conn = get_connection()
    c = conn.cursor()
    
    # Load status and pattern
    c.execute('SELECT status, pattern FROM game_state WHERE id=1')
    row = c.fetchone()
    status, pattern = row if row else ("waiting", "straight_line")
    
    # Load numbers in chronological order
    c.execute('SELECT number FROM called_numbers ORDER BY called_at ASC')
    numbers = [row[0] for row in c.fetchall()]
    
    conn.close()
    return status, pattern, numbers

def update_status(status):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE game_state SET status=? WHERE id=1', (status,))
    conn.commit()
    conn.close()

def update_pattern(pattern):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE game_state SET pattern=? WHERE id=1', (pattern,))
    conn.commit()
    conn.close()

def add_called_number(number):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute('INSERT INTO called_numbers (number) VALUES (?)', (number,))
        conn.commit()
    except sqlite3.IntegrityError:
        pass # Already exists
    finally:
        conn.close()

def remove_called_number(number):
    conn = get_connection()
    c = conn.cursor()
    c.execute('DELETE FROM called_numbers WHERE number=?', (number,))
    conn.commit()
    conn.close()

def reset_game(pattern="straight_line"):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE game_state SET status="waiting", pattern=? WHERE id=1', (pattern,))
    c.execute('DELETE FROM called_numbers')
    conn.commit()
    conn.close()
