import { useState, useEffect } from 'react';
import './App.css';

export function App() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <h1>deploygate example app</h1>
      <p className="time">{time}</p>
      <p className="note">This app was deployed using deploygate</p>
    </div>
  );
}
