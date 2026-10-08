import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Maximize2,
  Sparkles,
  Bot,
  CheckCircle2,
  Clock,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AssistantMessage } from '../../types';
import { WebbyAvatar } from './WebbyAvatar';
import { compileUserContext, askWebby } from '../../services/assistantService';

const STORAGE_KEY = 'web_ascend_webby_chat_history';

export const WebbyFloatingWidget: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    profile,
    missions,
    habits,
    dailyRecords,
    todayDate,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'happy'>('idle');
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'initial',
        role: 'model',
        text: `🕷️ Hey **${profile.username}**! Need a quick check on your daily routine or what's left on your schedule? I'm right here! ✨`,
        timestamp: Date.now(),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If already on the full ASSISTANT tab, hide the floating widget
  if (activeTab === 'ASSISTANT') {
    return null;
  }

  const userContext = compileUserContext(profile, missions, habits, dailyRecords, todayDate);
  const pendingCount = userContext.todaySummary.pendingCount;

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);
    setAvatarState('thinking');

    try {
      const freshContext = compileUserContext(profile, missions, habits, dailyRecords, todayDate);
      const reply = await askWebby(text, messages, freshContext);

      const botMsg: AssistantMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      setAvatarState('happy');
      setTimeout(() => setAvatarState('idle'), 2500);
    } catch (err) {
      console.error(err);
      setAvatarState('idle');
    } finally {
      setIsLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  return (
    <aside aria-label="Webby Assistant" className="fixed bottom-16 lg:bottom-6 right-4 sm:right-6 z-50 select-none">
      {/* Floating Chat Drawer / Popover */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[92vw] sm:w-[380px] h-[500px] rounded-2xl bg-[#090E1A]/95 border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/80 via-[#0E162B] to-slate-900/90 border-b border-blue-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <WebbyAvatar size="sm" state={avatarState} showBadge={false} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-['Chakra_Petch'] font-bold text-sm text-cyan-300">
                    WEBBY
                  </span>
                  <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded">
                    AI
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {pendingCount === 0 ? '✨ All objectives clear!' : `⏳ ${pendingCount} items left today`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Expand to Full Tab */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('ASSISTANT');
                }}
                title="Expand to Full Assistant Hub"
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts strip */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-blue-900/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage('What did I do today?')}
              disabled={isLoading}
              className="px-2 py-1 rounded bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/30 text-[11px] text-cyan-300 whitespace-nowrap cursor-pointer shrink-0"
            >
              🕷️ What did I do today?
            </button>
            <button
              onClick={() => handleSendMessage("What's left on my daily schedule?")}
              disabled={isLoading}
              className="px-2 py-1 rounded bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/30 text-[11px] text-slate-300 whitespace-nowrap cursor-pointer shrink-0"
            >
              📋 What's left?
            </button>
            <button
              onClick={() => handleSendMessage('Am I on track for a Perfect Day?')}
              disabled={isLoading}
              className="px-2 py-1 rounded bg-blue-950/50 hover:bg-blue-900/50 border border-blue-800/30 text-[11px] text-slate-300 whitespace-nowrap cursor-pointer shrink-0"
            >
              🎯 Perfect Day?
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 no-scrollbar text-xs">
            {messages.slice(-10).map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {isUser ? (
                    <div className="w-6 h-6 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center shrink-0 text-red-300 text-[10px]">
                      You
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center shrink-0 text-cyan-300 text-[10px]">
                      🕷️
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl p-2.5 leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-900/90 border border-blue-900/40 text-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-cyan-300 text-xs italic p-2 bg-slate-900/50 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Webby is scanning your schedule...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-2.5 bg-slate-950/90 border-t border-blue-900/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask about your routine..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-blue-900/40 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !inputPrompt.trim()}
                className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Trigger Orb */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Webby Assistant"
        className="relative group p-1.5 rounded-2xl bg-gradient-to-br from-[#0E1528] to-[#070A12] border-2 border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:shadow-[0_0_25px_rgba(34,211,238,0.55)] transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center"
      >
        <WebbyAvatar size="md" state={isOpen ? 'happy' : avatarState} showBadge={false} />

        {/* Counter Badge if tasks remaining */}
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-red-600 border border-red-400 text-white font-mono font-bold text-[9px] shadow-[0_0_8px_#ef4444]">
            {pendingCount}
          </span>
        )}

        {/* Tooltip on hover */}
        {!isOpen && (
          <span className="absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-[#0A0E17]/95 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Chat with Webby 🕷️
          </span>
        )}
      </button>
    </aside>
  );
};
