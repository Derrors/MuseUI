import React, { useState, useEffect } from 'react';
import { RequestLogEntry } from '../types';
import { clearRequestLogs, getRequestLogs } from '../services/apiKeyStore';

interface Props {
  lang: 'en' | 'zh';
}

const DevRequestMonitor: React.FC<Props> = ({ lang }) => {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const isZh = lang === 'zh';

  useEffect(() => {
    const load = () => setLogs(getRequestLogs().slice(0, 20));
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleClear = () => {
    clearRequestLogs();
    setLogs([]);
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-4 right-4 z-50 px-2 py-1 rounded-lg bg-stone-800/90 border border-stone-700 text-[10px] text-stone-400 hover:text-stone-200 transition-colors"
      >
        📡 {logs.length}
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-50 w-80 max-h-80 flex flex-col rounded-xl border border-stone-700 bg-stone-900/95 shadow-2xl backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-800 bg-stone-800/50">
        <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">
          {isZh ? '请求监控' : 'Request Monitor'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="text-[9px] text-stone-500 hover:text-stone-300 px-1.5 py-0.5 rounded hover:bg-stone-700 transition-colors"
          >
            {isZh ? '清空' : 'Clear'}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-stone-500 hover:text-stone-300 p-0.5"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 && (
          <div className="text-center text-stone-600 text-[10px] py-4">
            {isZh ? '暂无请求记录' : 'No requests yet'}
          </div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
              log.success
                ? 'bg-green-900/20 border border-green-900/30'
                : 'bg-red-900/20 border border-red-900/30'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                log.success ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-300 truncate">
                  {log.model || log.provider}
                </span>
                <span className="text-stone-500 shrink-0">
                  {log.type === 'text' ? (isZh ? '文本' : 'TXT') : (isZh ? '图片' : 'IMG')}
                </span>
              </div>
              <div className="text-stone-500 truncate" title={log.baseUrl}>
                {log.baseUrl}
              </div>
              {log.error && (
                <div className="text-red-400 truncate" title={log.error}>
                  {log.error}
                </div>
              )}
            </div>
            <div className="text-stone-400 shrink-0 text-right">
              <div>{log.latencyMs}ms</div>
              <div className="text-stone-600">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DevRequestMonitor;
