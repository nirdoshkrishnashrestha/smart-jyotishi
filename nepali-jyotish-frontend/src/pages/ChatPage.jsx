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
      <div className="bg-[#fcf9f2] p-3 rounded-lg border border-[#e6dfd1]">
        <span className="font-bold text-[#b27b4e] flex items-center gap-2 mb-1">✨ भविष्यवाणी:</span>
        <p className="text-sm">{data.prediction}</p>
      </div>
    )}
    {data.remedies && (
      <div className="bg-[#fff1f2] p-3 rounded-lg border border-[#fecdd3]">
        <span className="font-bold text-red-700 flex items-center gap-2 mb-1">🕉️ उपाय (Remedies):</span>
        <p className="text-sm text-red-900">{data.remedies}</p>
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
        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-sm border overflow-hidden ${
          msg.sender === 'user'
            ? 'bg-[#0f1d30] text-white border-[#0f1d30] rounded-tr-none'
            : 'bg-white text-[#0f1d30] border-[#e6dfd1] rounded-tl-none font-medium'
        }`}
      >
        <div className={`text-[15px] ${msg.isLoading ? 'animate-pulse text-[#b27b4e]' : ''}`}>
          {msg.answerData ? formatAiAnswer(msg.answerData) : msg.text}
        </div>
        <div className={`text-[11px] mt-3 text-right font-semibold ${msg.sender === 'user' ? 'text-gray-400' : 'text-[#b27b4e]'}`}>
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
    <div className="flex flex-col h-screen bg-[#fdfaf6] overflow-hidden">
      <header className="px-4 py-3 bg-white border-b border-[#e6dfd1] flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[#3a4a5e] hover:text-[#0f1d30] p-1.5 rounded-full hover:bg-[#fdfaf6] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#0f1d30] flex items-center justify-center text-white font-bold shadow-sm">
              SJ
            </div>
            <div>
              <h2 className="text-[#0f1d30] font-black tracking-tight leading-none text-lg">SmartJyotishi</h2>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#fdfaf6] border border-[#e6dfd1] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <span className="text-[#b27b4e] font-bold">🕒</span>
            <span className="text-[#0f1d30] font-bold text-sm">{limitMessage}</span>
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-6 relative"
        style={{ backgroundImage: "radial-gradient(circle at center, rgba(178,123,78,0.03) 0%, transparent 70%)" }}
      >
        {isLoadingHistory ? (
          <div className="text-center py-12 text-[#b27b4e] font-semibold">अघिल्ला च्याटहरू लोड हुँदैछन्...</div>
        ) : (
          <div className="space-y-6 w-full">
            {historyGroups.map((group) => (
              <div key={group.date} className="w-full space-y-6">
                <div className="flex justify-center">
                  <button 
                    onClick={() => toggleDate(group.date)}
                    className="flex items-center gap-2 bg-white/90 border border-[#e6dfd1] text-[#3a4a5e] text-xs font-bold uppercase tracking-[0.16em] px-4 py-2 rounded-full shadow-sm hover:bg-[#fdfaf6] transition-colors"
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

      <div className="p-3 sm:p-4 bg-white border-t border-[#e6dfd1] shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
          <button type="button" className="p-2 sm:p-3 text-[#3a4a5e] hover:text-[#b27b4e] transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLocked ? "24 घण्टापछि फेरि सोध्न सक्नुहुन्छ..." : "आफ्नो प्रश्न सोध्नुहोस्..."}
            className="flex-1 bg-[#fdfaf6] border border-[#e6dfd1] rounded-full px-5 py-3.5 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] transition-all font-medium placeholder-[#3a4a5e]"
            disabled={isLocked || isSending}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLocked || isSending}
            className={`p-3.5 sm:p-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
              inputValue.trim() && !isLocked && !isSending
                ? 'bg-[#b27b4e] hover:bg-[#c98e5e] text-white transform hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(178,123,78,0.3)]'
                : 'bg-[#e6dfd1] text-gray-400 cursor-not-allowed'
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
