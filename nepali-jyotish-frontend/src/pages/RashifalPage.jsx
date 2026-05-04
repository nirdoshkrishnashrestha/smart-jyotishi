import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const RashifalPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rashifal, setRashifal] = useState(null);
    const [activeTab, setActiveTab] = useState('today');

    const [debugInfo, setDebugInfo] = useState(null);

    const fetchRashifal = async () => {
        setLoading(true);
        setError(null);
        setRashifal(null);
        setDebugInfo(null);
        try {
            // Adding timestamp to avoid any proxy/browser caching
            const response = await api.get(`/api/profile/rashifal?t=${Date.now()}`);
            if (response.data && response.data.status === 'success') {
                setRashifal(response.data);
            } else {
                setRashifal(null);
                setError("माफ गर्नुहोला, राशिफल प्राप्त गर्न सकिएन।");
            }
        } catch (err) {
            console.error("Error fetching rashifal", err);
            const status = err.response?.status;
            const detail = err.response?.data?.detail;
            
            setRashifal(null);
            setDebugInfo(`Status: ${status}, Detail: ${JSON.stringify(detail)}`);
            
            const msg = detail || "तपाईंको प्रोफाइल फेला परेन। कृपया पहिले आफ्नो जन्म विवरण भर्नुहोस्।";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRashifal();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-light-bg">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#b27b4e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#b27b4e] font-bold text-xl animate-pulse">ब्रह्माण्डको ऊर्जा संकलन गर्दै...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center bg-light-bg">
                <div className="glass-card bg-white p-10 rounded-2xl border-t-4 border-t-red-500 max-w-md text-center shadow-xl">
                    <div className="text-4xl mb-4">🔮</div>
                    <p className="text-[#3a4a5e] mb-6 font-medium">{error}</p>
                    
                    {debugInfo && (
                        <div className="mb-6 p-2 bg-gray-100 rounded text-[10px] font-mono text-gray-500 break-all text-left">
                            {debugInfo}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={fetchRashifal}
                            className="w-full bg-[#0f1d30] hover:bg-[#1a2f4c] text-white font-bold py-3 px-8 rounded-xl shadow transition-all"
                        >
                            फेरि प्रयास गर्नुहोस् (Retry)
                        </button>
                        <button
                            onClick={() => navigate('/birth-details')}
                            className="w-full bg-[#b27b4e] hover:bg-[#c98e5e] text-white font-bold py-3 px-8 rounded-xl shadow transition-all"
                        >
                            जन्म विवरण भर्नुहोस्
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentRashifal = rashifal[activeTab];

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 pb-4 border-b border-[#e6dfd1]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#fdfaf6] border border-[#e6dfd1] text-[#0f1d30] hover:bg-[#b27b4e] hover:text-white transition-all shadow-sm"
                    >
                        ←
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-[#0f1d30] tracking-tight">
                        दैनिक <span className="text-[#b27b4e]">राशिफल</span>
                    </h1>
                </div>
                <div className="hidden sm:block text-right">
                    <p className="text-sm text-[#3a4a5e] font-medium">तपाईंको राशी</p>
                    <p className="font-bold text-[#b27b4e] text-xl">{rashifal.rashi}</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
                {/* Tabs */}
                <div className="flex bg-[#fdfaf6] border border-[#e6dfd1] rounded-2xl p-1 mb-8 shadow-sm">
                    {['today', 'week', 'month'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm md:text-base ${
                                activeTab === tab
                                    ? 'bg-[#0f1d30] text-white shadow-md scale-[1.02]'
                                    : 'text-[#3a4a5e] hover:bg-[#b27b4e]/10'
                            }`}
                        >
                            {tab === 'today' ? 'आज' : tab === 'week' ? 'हप्ता' : 'महिना'}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Hero Card */}
                    <div className="glass-card bg-white p-8 md:p-10 rounded-3xl border-l-[6px] border-l-[#b27b4e] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#b27b4e] opacity-[0.05] rounded-full pointer-events-none"></div>
                        <div className="absolute top-10 right-10 text-6xl opacity-10 pointer-events-none grayscale">✨</div>
                        
                        <h2 className="text-2xl md:text-3xl font-black text-[#0f1d30] mb-4">
                            {currentRashifal.title || `${activeTab === 'today' ? 'आजको' : activeTab === 'week' ? 'साप्ताहिक' : 'मासिक'} राशिफल`}
                        </h2>
                        <p className="text-[#3a4a5e] text-lg leading-relaxed mb-8 border-l-2 border-[#e6dfd1] pl-6 italic">
                            {currentRashifal.summary}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Health */}
                            <div className="bg-[#fcf8f0] p-6 rounded-2xl border border-[#e6dfd1] hover:border-[#b27b4e] transition-all group">
                                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform inline-block">🧘‍♂️</div>
                                <h3 className="font-black text-[#0f1d30] mb-2 uppercase tracking-wide text-xs">स्वास्थ्य (Health)</h3>
                                <p className="text-[#3a4a5e] text-sm leading-relaxed">{currentRashifal.health}</p>
                            </div>

                            {/* Career/Wealth */}
                            <div className="bg-[#f0f4f8] p-6 rounded-2xl border border-[#e6dfd1] hover:border-[#0f1d30] transition-all group">
                                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform inline-block">💼</div>
                                <h3 className="font-black text-[#0f1d30] mb-2 uppercase tracking-wide text-xs">करियर र धन (Career & Wealth)</h3>
                                <p className="text-[#3a4a5e] text-sm leading-relaxed">{currentRashifal.career}</p>
                            </div>

                            {/* Love/Family */}
                            <div className="bg-[#fdf2f7] p-6 rounded-2xl border border-[#e6dfd1] hover:border-pink-300 transition-all group">
                                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform inline-block">❤️</div>
                                <h3 className="font-black text-[#0f1d30] mb-2 uppercase tracking-wide text-xs">प्रेम र परिवार (Love & Family)</h3>
                                <p className="text-[#3a4a5e] text-sm leading-relaxed">{currentRashifal.love}</p>
                            </div>

                            {/* Remedy */}
                            <div className="bg-[#fffbeb] p-6 rounded-2xl border border-[#b27b4e]/30 hover:border-[#b27b4e] transition-all group">
                                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform inline-block">🕉️</div>
                                <h3 className="font-black text-[#0f1d30] mb-2 uppercase tracking-wide text-xs">विशेष उपाय (Remedy)</h3>
                                <p className="text-[#3a4a5e] text-sm leading-relaxed font-bold">{currentRashifal.remedy}</p>
                            </div>
                        </div>

                        {/* Today Specific Extras */}
                        {activeTab === 'today' && (
                            <div className="mt-10 pt-8 border-t border-[#e6dfd1] flex flex-wrap gap-4">
                                <div className="bg-[#fdfaf6] px-5 py-3 rounded-full border border-[#e6dfd1] flex items-center gap-3 shadow-sm">
                                    <span className="text-lg">🎨</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#b27b4e] uppercase">शुभ रंग</p>
                                        <p className="text-sm font-bold text-[#0f1d30]">{currentRashifal.lucky_color}</p>
                                    </div>
                                </div>
                                <div className="bg-[#fdfaf6] px-5 py-3 rounded-full border border-[#e6dfd1] flex items-center gap-3 shadow-sm">
                                    <span className="text-lg">🔢</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#b27b4e] uppercase">शुभ अंक</p>
                                        <p className="text-sm font-bold text-[#0f1d30]">{currentRashifal.lucky_number}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Bottom Navigation Tip */}
                    <div className="text-center py-6">
                        <button 
                            onClick={() => navigate('/chat')}
                            className="inline-flex items-center gap-2 text-[#b27b4e] font-bold hover:underline"
                        >
                            <span>थप जानकारी चाहिएमा ज्योतिषीसँग कुरा गर्नुहोस्</span>
                            <span className="text-xl">💬</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RashifalPage;
