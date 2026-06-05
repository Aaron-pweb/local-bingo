import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io(window.location.origin, { autoConnect: false });

export default function CallerDashboard({ toggleTheme, theme }) {
  const navigate = useNavigate();
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [inputNumber, setInputNumber] = useState('');
  const [verifyCardId, setVerifyCardId] = useState('');
  
  const [globalPattern, setGlobalPattern] = useState('straight_line');
  const [gameStatus, setGameStatus] = useState('waiting');
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    document.title = "Bingo Game Controller";
    if (!localStorage.getItem('bingo_auth')) {
      navigate('/login');
      return;
    }

    socket.connect();
    socket.on('state_sync', (data) => {
      setCalledNumbers(data.called_numbers);
      if(data.current_pattern) setGlobalPattern(data.current_pattern);
      if(data.game_status) setGameStatus(data.game_status);
    });
    socket.on('number_called', (data) => setCalledNumbers(prev => [...prev, data.number]));
    socket.on('number_removed', (data) => setCalledNumbers(prev => prev.filter(n => n !== data.number)));

    return () => {
      socket.off('state_sync');
      socket.off('number_called');
      socket.off('number_removed');
      socket.disconnect();
    };
  }, [navigate]);

  const handleCall = (e) => {
    e.preventDefault();
    if (gameStatus !== 'active') return;
    const num = parseInt(inputNumber);
    if (num >= 1 && num <= 75 && !calledNumbers.includes(num)) {
      socket.emit('call_number', { number: num });
    }
    setInputNumber('');
  };

  const handleRemove = (num) => {
    socket.emit('remove_number', { number: num });
  };
  
  const handlePatternChange = (e) => {
    const newPattern = e.target.value;
    setGlobalPattern(newPattern);
    socket.emit('set_pattern', { pattern: newPattern });
  };

  const startGame = () => {
    socket.emit('start_game');
  };

  const closeVerification = () => {
    socket.emit('hide_verification');
    setVerifyResult(null);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyResult(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: verifyCardId, pattern: globalPattern })
      });
      const data = await res.json();
      if (data.success) {
        setVerifyResult({ isWinner: data.is_winner });
      } else {
        setVerifyResult({ error: data.message });
      }
    } catch (err) {
      setVerifyResult({ error: 'Server error during verification' });
    }
  };
  
  const formatPattern = (pattern) => {
    const patterns = {
      straight_line: 'Straight Line',
      four_corners: 'Four Corners',
      full_house: 'Full House Blackout',
      letter_x: 'Letter X',
      letter_t: 'Letter T',
      letter_l: 'Letter L',
      cross: 'Cross',
      postage_stamp: 'Postage Stamp'
    };
    return patterns[pattern] || pattern;
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Bingo Caller Dashboard</h1>
        <button onClick={toggleTheme}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      {gameStatus === 'waiting' ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Game Setup</h2>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '1.2rem', fontWeight: 'bold', marginRight: '1rem' }}>Winning Pattern:</label>
            <select 
              value={globalPattern} 
              onChange={handlePatternChange}
              style={{ fontSize: '1.2rem', padding: '10px 20px', width: '300px' }}
            >
              <option value="straight_line">Straight Line</option>
              <option value="four_corners">Four Corners</option>
              <option value="full_house">Full House Blackout</option>
              <option value="letter_x">Letter X</option>
              <option value="letter_t">Letter T</option>
              <option value="letter_l">Letter L</option>
              <option value="cross">Cross</option>
              <option value="postage_stamp">Postage Stamp</option>
            </select>
          </div>
          <button 
            onClick={startGame}
            style={{ fontSize: '1.5rem', padding: '15px 40px', backgroundColor: 'var(--success)' }}
          >
            ▶ Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Active Pattern: {formatPattern(globalPattern)}</h2>
              <button className="danger" onClick={() => {
                if(window.confirm('End this game and return to setup?')) socket.emit('reset_game');
              }}>End Game</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 700px' }}>
              <div className="card">
                <h2>Call Number Board</h2>
                <div className="caller-grid-container">
                  {['B', 'I', 'N', 'G', 'O'].map((letter, rowIdx) => (
                    <div key={letter} className="caller-grid-row">
                      <div className={`caller-row-header row-${letter.toLowerCase()}`}>{letter}</div>
                      {Array.from({ length: 15 }, (_, i) => i + 1 + (rowIdx * 15)).map(num => {
                        const isCalled = calledNumbers.includes(num);
                        return (
                          <button
                            key={num}
                            className={`caller-btn ${isCalled ? 'called col-' + letter.toLowerCase() : ''}`}
                            onClick={() => { if (!isCalled) socket.emit('call_number', { number: num }); }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="card">
                <h2>Verify Card</h2>
                <form onSubmit={handleVerify} style={{ display: 'flex', gap: '10px', marginTop: '1rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Card Number"
                    value={verifyCardId}
                    onChange={(e) => setVerifyCardId(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit">Verify</button>
                </form>
                
                {verifyResult && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', 
                    backgroundColor: verifyResult.isWinner ? 'var(--success-bg)' : (verifyResult.error ? '#fee2e2' : '#fef2f2'),
                    color: verifyResult.isWinner ? 'var(--success)' : 'var(--danger)',
                    textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem',
                    display: 'flex', flexDirection: 'column', gap: '1rem'
                  }}>
                    <div>{verifyResult.error ? `Error: ${verifyResult.error}` : (verifyResult.isWinner ? "🎉 WINNER! 🎉" : "❌ INVALID BINGO ❌")}</div>
                    {!verifyResult.error && !verifyResult.isWinner && (
                      <button onClick={closeVerification} style={{ backgroundColor: '#444', color: 'white', padding: '10px', fontSize: '1rem', alignSelf: 'center', cursor: 'pointer' }}>
                        Close TV Verification
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="card">
                <h2>Called Numbers ({calledNumbers.length})</h2>
                <div className="number-history" style={{ marginTop: '1rem' }}>
                  {calledNumbers.map(num => (
                    <div key={num} className="history-pill">
                      {num}
                      <button onClick={() => handleRemove(num)} title="Remove">×</button>
                    </div>
                  ))}
                  {calledNumbers.length === 0 && <span style={{ color: 'var(--border-color)' }}>No numbers called yet.</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <footer style={{ position: 'fixed', bottom: '10px', right: '15px', fontSize: '0.85rem', color: '#000', opacity: 0.7, zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>Developed By:</span>
          <a href="https://t.me/Aaron_web" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>Aaron (@Aaron_web)</a>
          <span>|</span>
          <a href="https://t.me/Biniam_199" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>Biniam (@Biniam_199)</a>
        </div>
      </footer>
    </div>
  );
}
