import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(window.location.origin, { autoConnect: false });

export default function Display() {
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [latestNumber, setLatestNumber] = useState(null);
  const [currentPattern, setCurrentPattern] = useState('straight_line');
  const [gameStatus, setGameStatus] = useState('waiting');
  const [verifiedCard, setVerifiedCard] = useState(null);

  useEffect(() => {
    document.title = "Display";
    socket.connect();
    
    const onStateSync = (data) => {
      setCalledNumbers(data.called_numbers);
      if(data.current_pattern) setCurrentPattern(data.current_pattern);
      if(data.game_status) {
        setGameStatus(data.game_status);
        if (data.game_status === 'waiting') {
          setVerifiedCard(null);
        }
      }
      if (data.called_numbers.length > 0) {
        setLatestNumber(data.called_numbers[data.called_numbers.length - 1]);
      } else {
        setLatestNumber(null);
      }
    };

    const onNumberCalled = (data) => {
      setCalledNumbers(prev => {
        if(!prev.includes(data.number)) return [...prev, data.number];
        return prev;
      });
      setLatestNumber(data.number);
    };

    const onNumberRemoved = (data) => {
      setCalledNumbers(prev => {
        const next = prev.filter(n => n !== data.number);
        return next;
      });
      setLatestNumber(prevLatest => {
        if (prevLatest === data.number) return null;
        return prevLatest;
      });
    };

    socket.on('state_sync', onStateSync);
    socket.on('number_called', onNumberCalled);
    socket.on('number_removed', onNumberRemoved);
    socket.on('show_verification', (data) => setVerifiedCard(data));
    socket.on('hide_verification', () => setVerifiedCard(null));

    return () => {
      socket.off('state_sync', onStateSync);
      socket.off('number_called', onNumberCalled);
      socket.off('number_removed', onNumberRemoved);
      socket.off('show_verification');
      socket.off('hide_verification');
      socket.disconnect();
    };
  }, []);

  const renderBingoBoard = () => {
    const columns = [
      { letter: 'B', range: [1, 15], colorClass: 'col-b' },
      { letter: 'I', range: [16, 30], colorClass: 'col-i' },
      { letter: 'N', range: [31, 45], colorClass: 'col-n' },
      { letter: 'G', range: [46, 60], colorClass: 'col-g' },
      { letter: 'O', range: [61, 75], colorClass: 'col-o' },
    ];

    return (
      <div className="bingo-board">
        {columns.map(col => (
          <div key={col.letter} className={`bingo-col ${col.colorClass}`}>
            <div className="bingo-header">{col.letter}</div>
            {Array.from({ length: 15 }, (_, i) => i + col.range[0]).map(num => {
              const isActive = calledNumbers.includes(num);
              const isLatest = latestNumber === num;
              return (
                <div 
                  key={num} 
                  className={`bingo-cell ${isActive ? 'active' : ''} ${isLatest ? 'latest-pulse' : ''}`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
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
  }

  const getGlowClass = (num) => {
    if (!num) return '';
    if (num >= 1 && num <= 15) return 'glow-b';
    if (num >= 16 && num <= 30) return 'glow-i';
    if (num >= 31 && num <= 45) return 'glow-n';
    if (num >= 46 && num <= 60) return 'glow-g';
    if (num >= 61 && num <= 75) return 'glow-o';
    return '';
  };

  if (verifiedCard) {
    const { card_id, is_winner, card_data } = verifiedCard;
    const columns = ['B', 'I', 'N', 'G', 'O'];
    return (
      <div className="verification-overlay">
        {is_winner ? (
          <h1 className="winner-banner">🎉 BINGO! WINNER! 🎉</h1>
        ) : (
          <h1 className="invalid-banner">❌ INVALID BINGO ❌</h1>
        )}
        <h2 style={{ marginBottom: '2rem', fontSize: '3rem' }}>Card #{card_id}</h2>
        <div className="verified-card-board">
          {columns.map(col => (
            <div key={col} className={`bingo-col col-${col.toLowerCase()}`}>
              <div className="bingo-header">{col}</div>
              {card_data[col].map((num, idx) => {
                const isFree = num === "FREE";
                const isActive = isFree || calledNumbers.includes(num);
                return (
                  <div key={idx} className={`bingo-cell ${isActive ? 'active' : ''}`}>
                    {num}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameStatus === 'waiting') {
    return (
      <div className="display-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '5vw', color: '#555', textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
          WAITING FOR GAME TO START...
        </h1>
      </div>
    );
  }

  return (
    <div className="display-container">
      <div className="display-left">
        <div className="pattern-banner">
          Playing for: <span>{formatPattern(currentPattern)}</span>
        </div>
        {latestNumber ? (
          <div key={latestNumber} className={`latest-number-container ${getGlowClass(latestNumber)}`}>
            {latestNumber}
          </div>
        ) : (
          <div className="waiting-text">READY</div>
        )}
      </div>
      <div className="display-right">
        {renderBingoBoard()}
      </div>
    </div>
  );
}
