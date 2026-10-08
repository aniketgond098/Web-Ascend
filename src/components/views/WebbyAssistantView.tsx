import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
  Target,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Trash2,
  ShieldCheck,
  Award,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AssistantMessage } from '../../types';
import { WebbyAvatar } from '../ui/WebbyAvatar';
import { SpideyCoinIcon } from '../ui/SpideyCoinDisplay';
import { compileUserContext, askWebby } from '../../services/assistantService';
import { getMissionDate } from '../../utils/date';

const STORAGE_KEY = 'web_ascend_webby_chat_history';

export const WebbyAssistantView: React.FC = () => {
  const {
    profile,
    missions,
    habits,
    dailyRecords,
    todayDate,
    toggleMissionCompletion,
    toggleHabitCompletion,
    setActiveTab,
  } = useApp();

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
    return [
      {
        id: 'initial-welcome',
        role: 'model',
        text: `🕷️ **Hi ${profile.username || 'Operative'}! I'm Webby!** ✨\n\nI'm your personal cyber-spider AI companion. I track every single item on your daily schedule, monitor what you've accomplished today, watch over your habit streaks, and help you reach Ascension!\n\nAsk me anything! For example:\n• *"What did I accomplish today?"*\n• *"What's left on my daily schedule?"*\n• *"Am I on track for a Perfect Day?"*\n• *"How much XP and Coins can I still earn today?"*`,
        timestamp: Date.now(),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'happy'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compile full real-time telemetry snapshot
  const userContext = compileUserContext(profile, missions, habits, dailyRecords, todayDate);

  // Save chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat:', e);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
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
      // Re-compile current context in case user just marked something complete
      const freshContext = compileUserContext(profile, missions, habits, dailyRecords, todayDate);
      const reply = await askWebby(text, messages, freshContext);

      const botMsg: AssistantMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setAvatarState('happy');
      setTimeout(() => setAvatarState('idle'), 3000);

      // Voice read-aloud if enabled
      if (voiceEnabled && 'speechSynthesis' in window) {
        speakResponse(reply);
      }
    } catch (error) {
      console.error('Error talking to Webby:', error);
      const errorMsg: AssistantMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'model',
        text: `⚠️ Webby's neural link hit minor interference, but don't worry! Here is your quick daily status: you've finished **${userContext.todaySummary.completedCount}/${userContext.todaySummary.totalObjectives} objectives** today. Ask me again or check your schedule below!`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setAvatarState('idle');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const speakResponse = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      // Strip markdown symbols for clean speech
      const cleanText = text
        .replace(/[*_#`~[\]]/g, '')
        .replace(/•/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.2; // Slightly higher, cute pitch
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    const welcome: AssistantMessage = {
      id: `welcome-${Date.now()}`,
      role: 'model',
      text: `🕷️ Chat reset! I'm ready for your questions, Operative **${profile.username}**. Ask me about your routine, today's tasks, or streak!`,
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const quickPrompts = [
    { label: 'What did I do today?', icon: '🕷️', prompt: 'What did I do today? Give me a full breakdown of what I accomplished.' },
    { label: "What's left on my schedule?", icon: '📋', prompt: "What is remaining on my daily schedule today? List pending tasks and habits." },
    { label: 'Am I on track for a Perfect Day?', icon: '🎯', prompt: 'Am I on track for a Perfect Day today? What do I need to finish?' },
    { label: 'Check my habit streaks', icon: '🔥', prompt: 'How are my daily protocol streaks doing? Which ones are at risk today?' },
    { label: 'Potential XP & Coins left', icon: '🪙', prompt: 'How much XP and Spidey Coins can I still earn before today ends?' },
    { label: 'Plan my next 2 hours', icon: '⚡', prompt: 'Based on my pending missions and habits, recommend an action plan for the rest of my day.' },
  ];

  // Render nicely formatted markdown lines
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-sm">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-2" />;

          // Bold headers or lists
          let formattedLine: React.ReactNode = line;

          // Parse **bold** and *italic*
          const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
          formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="text-white font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="text-cyan-300 italic">
                  {part.slice(1, -1)}
                </em>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="bg-blue-950/60 border border-blue-800/40 px-1 py-0.5 rounded text-cyan-300 font-mono text-xs">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });

          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-cyan-400 mt-1 select-none">•</span>
                <span className="flex-1 text-slate-200">{formattedLine}</span>
              </div>
            );
          }

          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-['Chakra_Petch'] font-bold text-cyan-300 text-sm tracking-wide mt-2">
                {line.replace('### ', '')}
              </h4>
            );
          }

          return (
            <p key={idx} className="text-slate-200">
              {formattedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Card & Telemetry Ribbon */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0B132B]/90 via-[#0A0E17]/95 to-[#070A12]/90 border border-blue-500/25 p-5 sm:p-6 shadow-[0_0_30px_rgba(37,99,235,0.12)] overflow-hidden">
        {/* Glow corner accent */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Mascot Info */}
          <div className="flex items-center gap-4">
            <WebbyAvatar size="lg" state={avatarState} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black font-['Chakra_Petch'] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-red-400">
                  WEBBY
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  v4.2 AI Companion
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Synced with Today's Routine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Your intelligent cyber-spider strategist. Ask anything about your daily schedule, completed missions, active protocols, and progress toward Ascension!
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {/* Voice toggle */}
            <button
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              title={voiceEnabled ? 'Mute Webby Voice' : 'Enable Webby Voice Readout'}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                voiceEnabled
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Voice</span>
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Real-time Telemetry Stats Pill Bar */}
        <div className="mt-5 pt-4 border-t border-blue-900/30 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="bg-slate-900/50 border border-blue-900/30 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Completed Today</div>
              <div className="text-sm font-bold font-['Chakra_Petch'] text-white">
                {userContext.todaySummary.completedCount} / {userContext.todaySummary.totalObjectives}
                <span className="text-[11px] font-normal text-cyan-400 ml-1.5">
                  ({userContext.todaySummary.completionPercentage}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-blue-900/30 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Pending Today</div>
              <div className="text-sm font-bold font-['Chakra_Petch'] text-amber-300">
                {userContext.todaySummary.pendingCount} objectives
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-blue-900/30 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Active Streak</div>
              <div className="text-sm font-bold font-['Chakra_Petch'] text-white">
                {profile.currentStreak} Days
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-blue-900/30 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Today's XP & Coins</div>
              <div className="text-sm font-bold font-['Chakra_Petch'] text-white flex items-center gap-1.5">
                <span>+{userContext.todaySummary.xpEarnedToday} XP</span>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400">+{userContext.todaySummary.essenceEarnedToday} 🪙</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-blue-900/30 rounded-xl p-2.5 flex items-center gap-3 col-span-2 sm:col-span-4 lg:col-span-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              userContext.todaySummary.isPerfectDayAchieved
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
            }`}>
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Perfect Day</div>
              <div className={`text-xs font-bold font-['Chakra_Petch'] ${
                userContext.todaySummary.isPerfectDayAchieved ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {userContext.todaySummary.isPerfectDayAchieved ? 'Achieved 🌟' : `${userContext.todaySummary.pendingCount} to go`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chat Workspace & Live Daily Objectives Companion Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Chat Experience */}
        <div className="lg:col-span-2 flex flex-col h-[640px] rounded-2xl bg-[#090D18]/90 border border-blue-900/30 shadow-xl overflow-hidden backdrop-blur-md">
          {/* Quick Prompt Chips */}
          <div className="p-3 bg-[#070A12]/80 border-b border-blue-900/20 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider pl-1">
                Quick Inquiries:
              </span>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/40 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                >
                  <span>{qp.icon}</span>
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 no-scrollbar">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar Icon */}
                  {isUser ? (
                    <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <User className="w-4 h-4" />
                    </div>
                  ) : (
                    <WebbyAvatar size="sm" state={avatarState} showBadge={false} />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'bg-[#0E1526]/90 border border-blue-900/40 text-slate-200 shadow-md'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between border-b border-blue-900/30 pb-2 mb-2 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3 h-3 text-cyan-400" />
                          Webby Companion
                        </span>
                        <div className="flex items-center gap-2">
                          {voiceEnabled && (
                            <button
                              onClick={() => speakResponse(msg.text)}
                              title="Listen"
                              className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            title="Copy text"
                            className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <span className="text-slate-500 font-normal">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}

                    {isUser ? (
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    ) : (
                      renderMessageContent(msg.text)
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <WebbyAvatar size="sm" state="thinking" showBadge={false} />
                <div className="rounded-2xl p-4 bg-[#0E1526]/90 border border-cyan-500/30 text-slate-200 shadow-md flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    Webby is consulting your daily schedule & telemetry...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-[#070A12]/95 border-t border-blue-900/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask Webby about today's tasks, routine, habits, XP..."
                  disabled={isLoading}
                  className="w-full bg-[#0B1020] border border-blue-900/50 focus:border-cyan-400/80 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 font-sans transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputPrompt.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm transition-all duration-200 shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Live Daily Routine & Schedule Telemetry Deck */}
        <div className="space-y-4 flex flex-col h-[640px]">
          {/* Live Objectives Panel */}
          <div className="flex-1 rounded-2xl bg-[#090D18]/90 border border-blue-900/30 p-5 shadow-xl flex flex-col overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <h3 className="font-['Chakra_Petch'] font-bold text-sm tracking-wide text-white uppercase">
                  Today's Live Web
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {userContext.formattedDate}
              </span>
            </div>

            {/* Scrollable Objectives List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-3">
              {/* Daily Missions */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Missions for Today ({userContext.missions.completed.length + userContext.missions.pending.length})</span>
                  <button
                    onClick={() => setActiveTab('MISSIONS')}
                    className="text-cyan-400 hover:underline text-[10px] lowercase flex items-center"
                  >
                    view all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {userContext.missions.completed.length === 0 && userContext.missions.pending.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-xl border border-blue-900/20 text-center">
                    No missions scheduled for today yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Pending first */}
                    {userContext.missions.pending.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMissionCompletion(m.id)}
                        className="p-2.5 rounded-xl bg-slate-900/70 border border-blue-900/40 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-4 h-4 rounded border border-slate-600 group-hover:border-cyan-400 flex items-center justify-center shrink-0" />
                          <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
                            {m.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded shrink-0">
                          +{m.xpReward} XP
                        </span>
                      </div>
                    ))}

                    {/* Completed */}
                    {userContext.missions.completed.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMissionCompletion(m.id)}
                        className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 transition-all flex items-center justify-between gap-2 cursor-pointer opacity-70 hover:opacity-100"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-400 line-through truncate">
                            {m.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                          Done
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily Protocols (Habits) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Daily Protocols ({userContext.dailyProtocols.completed.length + userContext.dailyProtocols.pending.length})</span>
                  <button
                    onClick={() => setActiveTab('HABITS')}
                    className="text-cyan-400 hover:underline text-[10px] lowercase flex items-center"
                  >
                    view all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Pending Habits */}
                  {userContext.dailyProtocols.pending.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => toggleHabitCompletion(h.id)}
                      className="p-2.5 rounded-xl bg-slate-900/70 border border-blue-900/40 hover:border-amber-500/50 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-4 h-4 rounded border border-slate-600 group-hover:border-amber-400 flex items-center justify-center shrink-0" />
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 shrink-0">
                        <Flame className="w-3 h-3" /> {h.currentStreak}d
                      </span>
                    </div>
                  ))}

                  {/* Completed Habits */}
                  {userContext.dailyProtocols.completed.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => toggleHabitCompletion(h.id)}
                      className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 transition-all flex items-center justify-between gap-2 cursor-pointer opacity-70 hover:opacity-100"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-400 line-through truncate">
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 shrink-0">
                        <Flame className="w-3 h-3" /> {h.currentStreak}d
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Helper Footer */}
            <div className="pt-3 border-t border-blue-900/30 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Live Cloud Sync
              </span>
              <button
                onClick={() => handleSendMessage('Give me a detailed summary of my progress and what I did today.')}
                className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                Summarize Day ✨
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
