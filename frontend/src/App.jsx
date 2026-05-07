import React, { useState, useEffect } from 'react';
import { LineChart, Line, YAxis, XAxis, ResponsiveContainer, Tooltip, Area, AreaChart, CartesianGrid } from 'recharts';
import { Droplets, Power, Activity, History, Waves, Leaf, Zap } from 'lucide-react';
import io from 'socket.io-client';
import './App.css';

// Connect to the backend bridge
const socket = io('http://localhost:3001');

// SVG Gauge radius & circumference
const GAUGE_RADIUS = 74;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

// Custom Chart Tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-time">{label}</div>
      <div className="tooltip-value">
        {payload[0].value}<span>%</span>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState({ moisture: 0, pump: false });
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const pumpRef = React.useRef(data.pump);
  
  // Keep ref in sync with state
  React.useEffect(() => {
    pumpRef.current = data.pump;
  }, [data.pump]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    const handleSensorData = (payload) => {
      console.log('Received payload:', payload);
      // 1. Update Live Data
      setData(payload);
      
      // 2. Update Real-time Graph (Rolling 15 points)
      setHistory(prev => {
        const newTime = new Date().toLocaleTimeString().split(' ')[0];
        const newEntry = { time: newTime, val: payload.moisture };
        return [...prev.slice(-14), newEntry];
      });

      // 3. Update Activity Logs on status change
      if (payload.pump !== pumpRef.current) {
        const logMsg = `Pump ${payload.pump ? 'Started 💧' : 'Stopped 🛑'} at ${new Date().toLocaleTimeString()}`;
        setLogs(prev => [logMsg, ...prev.slice(0, 5)]);
      }
    };

    socket.on('sensorData', handleSensorData);

    return () => {
      socket.off('sensorData', handleSensorData);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // Calculate gauge stroke offset
  const gaugeOffset = GAUGE_CIRCUMFERENCE - (data.moisture / 100) * GAUGE_CIRCUMFERENCE;

  return (
    <div className="dashboard-shell">
      {/* ─── Header ─── */}
      <header className="dashboard-header animate-fade-up">
        <div className="header-logo">
          <div className="header-logo-icon">
            <Leaf size={24} />
          </div>
          <h1 className="header-title">AQUA-SENSE AI</h1>
        </div>
        <p className="header-subtitle">Smart Irrigation Intelligence</p>
        <div className="connection-badge">
          <div className="connection-dot" />
          LIVE USB CONNECTION
        </div>
      </header>

      {/* ─── Dashboard Grid ─── */}
      <div className="dashboard-grid">

        {/* ═══ Moisture Card ═══ */}
        <div className="glass-card moisture-card animate-fade-up delay-1">
          <div className="card-body">
            <div className="card-label">
              <Droplets size={14} />
              Soil Moisture
            </div>

            {/* Circular Gauge */}
            <div className="moisture-gauge">
              <div className="gauge-ring">
                <svg viewBox="0 0 180 180">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <circle
                    className="gauge-track"
                    cx="90" cy="90" r={GAUGE_RADIUS}
                  />
                  <circle
                    className="gauge-fill"
                    cx="90" cy="90" r={GAUGE_RADIUS}
                    strokeDasharray={GAUGE_CIRCUMFERENCE}
                    strokeDashoffset={gaugeOffset}
                  />
                </svg>
              </div>
              <div className="gauge-center">
                <span className="gauge-value">{data.moisture}</span>
                <span className="gauge-unit">%</span>
                <span className="gauge-sublabel">Moisture</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="moisture-bar-wrap">
              <div className="moisture-bar-track">
                <div
                  className="moisture-bar-fill"
                  style={{ width: `${data.moisture}%` }}
                />
              </div>
              <div className="moisture-bar-labels">
                <span>Dry</span>
                <span>Saturated</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Pump Status Card ═══ */}
        <div className="glass-card pump-card animate-fade-up delay-2">
          <div className="card-body">
            <div className="card-label">
              <Power size={14} />
              System Status
            </div>

            <div className={`pump-indicator ${data.pump ? 'active' : 'inactive'}`}>
              <Zap size={36} />
            </div>

            <div className={`pump-status-text ${data.pump ? 'active' : 'inactive'}`}>
              {data.pump ? 'PUMPING' : 'IDLE'}
            </div>

            <div className="pump-meta">
              {data.pump ? 'Water flow active' : 'System on standby'}
            </div>
          </div>
        </div>

        {/* ═══ History Chart ═══ */}
        <div className="glass-card chart-card animate-fade-up delay-3">
          <div className="card-body">
            <div className="chart-header">
              <div className="chart-header-left">
                <Activity size={14} />
                <span>Live Flux History</span>
              </div>
              <div className="chart-header-right">
                <div className="chart-live-dot" />
                <span>Real-time</span>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(52, 211, 153, 0.04)"
                    vertical={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#34d399"
                    strokeWidth={3}
                    fill="url(#chartGradient)"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <YAxis
                    hide
                    domain={[0, 100]}
                  />
                  <XAxis
                    dataKey="time"
                    hide
                  />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ═══ Activity Logs ═══ */}
        <div className="glass-card log-card animate-fade-up delay-4">
          <div className="card-body">
            <div className="log-header">
              <div className="log-header-left">
                <History size={14} />
                <span>Activity Logs</span>
              </div>
              <span className="log-count">{logs.length} events</span>
            </div>

            <div className="log-list">
              {logs.length > 0 ? logs.map((log, i) => (
                <div key={i} className="log-entry">
                  <div className="log-entry-dot" />
                  {log}
                </div>
              )) : (
                <div className="log-empty">
                  <Activity size={18} className="log-empty-icon" />
                  Scanning for packets...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="dashboard-footer">
        AQUA-SENSE AI · Powered by Arduino
      </footer>
    </div>
  );
}