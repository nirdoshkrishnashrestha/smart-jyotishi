import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ENGLISH_LOCALE = 'en-US';
const KATHMANDU_TIMEZONE = 'Asia/Kathmandu';

const formatKathmanduTime = (dateInput) =>
  new Intl.DateTimeFormat(ENGLISH_LOCALE, {
    timeZone: KATHMANDU_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(dateInput));

const formatKathmanduDateTime = (dateInput) =>
  new Intl.DateTimeFormat(ENGLISH_LOCALE, {
    timeZone: KATHMANDU_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(dateInput));

const formatDateKey = (dateInput) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: KATHMANDU_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateInput));

const createGreetingMessage = (remainingQuestions = 3) => {
  const createdAt = new Date().toISOString();

  return {
    id: 'greeting-ai',
    sender: 'ai',
    text: `नमस्ते! तपाईंसँग अझै ${remainingQuestions} प्रश्न बाँकी छन्। आफ्नो कुण्डली र भविष्यको बारेमा के जान्न चाहनुहुन्छ?`,
    timestamp: formatKathmanduTime(createdAt),
    createdAt,
  };
};

const formatAiAnswer = (data) => (
  <div className="space-y-4">
    <p className="leading-relaxed">{data.analysis || data.error}</p>
    {data.prediction && (
      <div className="rounded-lg border border-white/80 bg-white/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
        <span className="mb-1 flex items-center gap-2 font-bold text-[#7a6420]">✦ भविष्यवाणी:</span>
        <p className="text-sm">{data.prediction}</p>
      </div>
    )}
    {data.remedies && (
      <div className="rounded-lg border border-white/80 bg-white/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
        <span className="mb-1 flex items-center gap-2 font-bold text-[#8b1d2c]">✢ उपाय (Remedies):</span>
        <p className="text-sm text-[#5d2530]">{data.remedies}</p>
      </div>
    )}
  </div>
);

const buildMessagePair = (chat) => {
  const createdAt = chat.created_at || new Date().toISOString();
  const timestamp = formatKathmanduTime(createdAt);

  return [
    {
      id: `user-${chat.id}`,
      sender: 'user',
      text: chat.question,
      timestamp,
      createdAt,
    },
    {
      id: `ai-${chat.id}`,
      sender: 'ai',
      answerData: chat.answer,
      timestamp,
      createdAt,
    }
  ];
};

const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([createGreetingMessage()]);
  const [historyGroups, setHistoryGroups] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState(3);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const formatDateLabel = (dateInput) => {
    const date = new Date(dateInput);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dateKey = formatDateKey(date);
    if (dateKey === formatDateKey(today)) return "आज";
    if (dateKey === formatDateKey(yesterday)) return "हिजो";

    return new Intl.DateTimeFormat(ENGLISH_LOCALE, {
      timeZone: KATHMANDU_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const applyChatStatus = (data) => {
    setRemainingQuestions(data.remaining_questions ?? 0);
    setLockedUntil(data.locked_until || null);
    setIsLocked(Boolean(data.is_locked));
    setMessages((prev) =>
      prev.length === 1 && prev[0].id === 'greeting-ai'
        ? [createGreetingMessage(data.remaining_questions ?? 0)]
        : prev
    );
  };

  const fetchChatStatus = async () => {
    const response = await api.get('/api/chat/status');
    applyChatStatus(response.data);
  };

  const fetchHistory = async () => {
    const response = await api.get('/api/chat/history');
    const history = response.data.history || [];

    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    setHistoryGroups(sortedHistory);
    
    const todayStr = formatDateKey(new Date());
    const initialExpanded = {};
    sortedHistory.forEach(g => {
        if (g.date === todayStr) {
            initialExpanded[g.date] = true;
        }
    });
    setExpandedDates(initialExpanded);

    setMessages(prev => prev.length === 1 && prev[0].id === 'greeting-ai' ? prev : [createGreetingMessage(remainingQuestions)]);
  };

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadChatPage = async () => {
      try {
        await Promise.all([fetchChatStatus(), fetchHistory()]);
      } catch (error) {
        console.error("Could not load chat page data", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatPage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    if (isLocked || remainingQuestions <= 0) {
      alert(
        lockedUntil
          ? `तपाईंले २४ घण्टाभित्रको ३ प्रश्नको सीमा पूरा गर्नुभएको छ। कृपया ${formatKathmanduDateTime(lockedUntil)} पछि फेरि सोध्नुस्।`
          : "तपाईंले २४ घण्टाभित्रको ३ प्रश्नको सीमा पूरा गर्नुभएको छ।"
      );
      return;
    }

    const createdAt = new Date().toISOString();
    const timestamp = formatKathmanduTime(createdAt);
    const questionText = inputValue.trim();

    const newMessage = {
      id: `user-${Date.now()}`,
      text: questionText,
      sender: "user",
      timestamp,
      createdAt,
    };

    const loadingId = `loading-${Date.now()}`;

    setMessages(prev => [
      ...prev,
      newMessage,
      {
        id: loadingId,
        text: "तपाईंको कुण्डली विश्लेषण गर्दै...",
        sender: "ai",
        timestamp,
        createdAt,
        isLoading: true
      }
    ]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await api.post('/api/chat/ask', { question: questionText });
      applyChatStatus(response.data);
      const answerData = response.data.answer;

      setMessages(prev => prev.map(msg =>
        msg.id === loadingId
          ? { ...msg, answerData, text: null, isLoading: false }
          : msg
      ));
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "माफ गर्नुहोस्, विश्लेषण गर्न समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।";
      if (error.response?.status === 429) {
        try {
          await fetchChatStatus();
        } catch (statusError) {
          console.error("Could not refresh chat status", statusError);
        }
      }
      setMessages(prev => prev.map(msg =>
        msg.id === loadingId ? { ...msg, text: errorMsg, isLoading: false } : msg
      ));
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = (msg) => (
    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] md:max-w-[72%] rounded-2xl px-5 py-4 border overflow-hidden backdrop-blur-2xl ${
          msg.sender === 'user'
            ? 'bg-[#20345f]/92 text-white border-[#20345f]/90 rounded-tr-none shadow-[0_18px_40px_rgba(32,52,95,0.18)]'
            : 'bg-white/68 text-[#171b22] border-white/82 rounded-tl-none font-medium shadow-[0_18px_40px_rgba(22,12,18,0.08),inset_0_1px_0_rgba(255,255,255,0.82)]'
        }`}
      >
        <div className={`text-[15px] ${msg.isLoading ? 'animate-pulse text-[#7a6420]' : ''}`}>
          {msg.answerData ? formatAiAnswer(msg.answerData) : msg.text}
        </div>
        <div className={`mt-3 text-right text-[11px] font-semibold ${msg.sender === 'user' ? 'text-slate-300' : 'text-[#7a6420]'}`}>
          {msg.timestamp}
        </div>
      </div>
    </div>
  );

  const limitMessage = isLocked
    ? lockedUntil
      ? `३/३ प्रश्न प्रयोग भइसके। ${formatKathmanduDateTime(lockedUntil)} पछि फेरि सोध्न सक्नुहुन्छ।`
      : "२४ घण्टाभित्रका ३/३ प्रश्न प्रयोग भइसके।"
    : `आज अझै ${remainingQuestions} प्रश्न सोध्न सक्नुहुन्छ`;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[linear-gradient(135deg,#f4f1e9_0%,#fffdf8_42%,#edf7f4_100%)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 opacity-40 [background-image:linear-gradient(90deg,rgba(22,12,18,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(32,52,95,0.035)_1px,transparent_1px)] [background-size:76px_76px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 opacity-80 [background-image:linear-gradient(120deg,transparent_0_39%,rgba(199,162,74,0.13)_39.12%,transparent_39.3%_100%),linear-gradient(34deg,transparent_0_66%,rgba(73,182,166,0.12)_66.12%,transparent_66.3%_100%)]"
      />

      <header className="relative z-20 mx-4 mt-5 flex shrink-0 items-center justify-between rounded-lg border border-white/75 bg-white/34 px-4 py-3 shadow-[0_16px_55px_rgba(22,12,18,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl sm:mx-6 lg:mx-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-full p-1.5 text-[#5d6570] transition-colors hover:bg-white/55 hover:text-[#171b22]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c7a24a]/55 bg-white/58 pt-1 text-base text-[#8b1d2c] shadow-[inset_0_0_18px_rgba(255,255,255,0.75),0_10px_26px_rgba(22,12,18,0.09)] backdrop-blur-xl font-['Noto_Serif_Devanagari',serif]">
              ॐ
            </div>
            <div>
              <h2 className="font-['Cinzel','Times_New_Roman',serif] text-lg font-semibold leading-none tracking-[0.08em] text-[#171b22]">SmartJyotishi</h2>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#1f8f84]">
                <span className="h-2 w-2 rounded-full bg-[#1f8f84] animate-pulse"></span> Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/58 px-3 py-1.5 text-sm font-bold text-[#20345f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
            <span className="font-bold text-[#7a6420]">◔</span>
            <span>{limitMessage}</span>
          </div>
        </div>
      </header>

      <div
        className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 pt-5 space-y-6 sm:px-6 lg:px-8"
      >
        {isLoadingHistory ? (
          <div className="rounded-lg border border-white/80 bg-white/62 py-12 text-center font-semibold text-[#20345f] shadow-[0_24px_80px_rgba(22,12,18,0.09),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl">अघिल्ला च्याटहरू लोड हुँदैछन्...</div>
        ) : (
          <div className="space-y-6 w-full">
            {historyGroups.map((group) => (
              <div key={group.date} className="w-full space-y-6">
                <div className="flex justify-center">
                  <button 
                    onClick={() => toggleDate(group.date)}
                    className="flex items-center gap-2 rounded-full border border-white/80 bg-white/62 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5d6570] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl transition-colors hover:bg-white/78"
                  >
                    <span>{formatDateLabel(group.date)}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${expandedDates[group.date] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {expandedDates[group.date] && (
                  <div className="space-y-6">
                    {group.chats.flatMap(buildMessagePair).map(renderMessage)}
                  </div>
                )}
              </div>
            ))}
            
            {messages.map(renderMessage)}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative z-20 mx-4 mb-4 rounded-lg border border-white/80 bg-white/62 p-3 shadow-[0_24px_80px_rgba(22,12,18,0.09),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl sm:mx-6 sm:p-4 lg:mx-8">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
          <button type="button" className="shrink-0 p-2 text-[#5d6570] transition-colors hover:text-[#1f8f84] sm:p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLocked ? "24 घण्टापछि फेरि सोध्न सक्नुहुन्छ..." : "आफ्नो प्रश्न सोध्नुहोस्..."}
            className="flex-1 rounded-full border border-white/85 bg-white/72 px-5 py-3.5 font-medium text-[#171b22] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl transition-all placeholder-[#5d6570] focus:outline-none focus:border-[#49b6a6] focus:ring-2 focus:ring-[#49b6a6]/20"
            disabled={isLocked || isSending}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLocked || isSending}
            className={`p-3.5 sm:p-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
              inputValue.trim() && !isLocked && !isSending
                ? 'bg-[#20345f] hover:bg-[#172848] text-white transform hover:-translate-y-0.5 shadow-[0_14px_30px_rgba(32,52,95,0.2)]'
                : 'bg-white/65 text-gray-400 cursor-not-allowed border border-white/85'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 translate-x-[1px] translate-y-[-1px]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
