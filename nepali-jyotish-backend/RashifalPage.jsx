import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const RashifalPage = () => {
  const navigate = useNavigate();
  const [rashifal, setRashifal] = useState(null);
  const [rashi, setRashi] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("today");

  useEffect(() => {
    const fetchRashifal = async () => {
      try {
        const response = await api.get('/api/profile/rashifal');
        if (response.data && response.data.status === 'success') {
          setRashifal(response.data.rashifal);
          setRashi(response.data.rashi);
        } else {
          setError("राशिफल प्राप्त गर्न सकिएन।");
        }
      } catch (err) {
        console.error("Rashifal fetch error", err);
        setError(err.response?.data?.detail || "राशिफल लोड गर्दा समस्या आयो।");
      } finally {
        setLoading(false);
      }
    };
    fetchRashifal();
  }, []);

  const renderContent = (data) => {
    if (!data) return null;
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="glass-card bg-white p-6 rounded-2xl border-l-4 border-[#b27b4e]">
          <h2 className="text-xl font-bold text-[#0f1d30] mb-3">{data.title}</h2>
          <p className="text-[#3a4a5e] leading-relaxed text-lg">{data.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card bg-white p-6 rounded-2xl border-t-4 border-[#4a90e2]">
            <h3 className="font-bold text-[#0f1d30] mb-2 flex items-center gap-2">🏥 स्वास्थ्य (Health)</h3>
            <p className="text-[#3a4a5e]">{data.health}</p>
          </div>
          <div className="glass-card bg-white p-6 rounded-2xl border-t-4 border-[#f5a623]">
            <h3 className="font-bold text-[#0f1d30] mb-2 flex items-center gap-2">💼 करियर र धन (Career)</h3>
            <p className="text-[#3a4a5e]">{data.career}</p>
          </div>
          <div className="glass-card bg-white p-6 rounded-2xl border-t-4 border-[#e91e63]">
            <h3 className="font-bold text-[#0f1d30] mb-2 flex items-center gap-2">❤️ प्रेम र परिवार (Love)</h3>
            <p className="text-[#3a4a5e]">{data.love}</p>
          </div>
          <div className="glass-card bg-white p-6 rounded-2xl border-t-4 border-[#4caf50]">
            <h3 className="font-bold text-[#0f1d30] mb-2 flex items-center gap-2">✨ उपाय (Remedy)</h3>
            <p className="text-[#3a4a5e]">{data.remedy}</p>
          </div>
        </div>

        {activeTab === "today" && (
          <div className="flex flex-wrap gap-4">
            <div className="bg-white px-6 py-3 rounded-xl border border-[#e6dfd1] flex items-center gap-3 shadow-sm">
              <span className="text-sm font-bold text-[#3a4a5e]">शुभ रंग:</span>
              <span className="text-lg font-black text-[#0f1d30]">{data.lucky_color}</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-xl border border-[#e6dfd1] flex items-center gap-3 shadow-sm">
              <span className="text-sm font-bold text-[#3a4a5e]">शुभ अंक:</span>
              <span className="text-lg font-black text-[#0f1d30]">{data.lucky_number}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#fdfaf6]">
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-[#e6dfd1]">
        <h1 className="text-2xl md:text-3xl font-black text-[#0f1d30] tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
          SMART <span className="text-[#b27b4e]">JYOTISHI</span>
        </h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-[#b27b4e] font-bold hover:underline"
        >
          ← Dashboard
        </button>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-block px-4 py-1 bg-[#b27b4e] text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Personalized Rashifal
          </div>
          <h2 className="text-4xl font-black text-[#0f1d30] mb-2">{rashi} राशिफल</h2>
          <p className="text-[#3a4a5e] font-medium">तपाईंको कुण्डली र वर्तमान ग्रह गोचरमा आधारित विशेष भविष्यवाणी</p>
        </div>

        <div className="flex justify-center p-1 bg-white rounded-2xl shadow-sm border border-[#e6dfd1] max-w-md mx-auto">
          {["today", "week", "month"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab 
                  ? "bg-[#0f1d30] text-white shadow-lg" 
                  : "text-[#3a4a5e] hover:bg-[#fdfaf6]"
              }`}
            >
              {tab === "today" ? "आज" : tab === "week" ? "हप्ता" : "महिना"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#b27b4e] font-bold text-xl animate-pulse">ग्रहको चाल गणना गर्दै...</div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl p-8 border border-red-100">
            <p className="text-red-500 font-bold mb-4">{error}</p>
            <button 
              onClick={() => navigate('/birth-details')}
              className="bg-[#b27b4e] text-white px-6 py-2 rounded-lg font-bold"
            >
              Birth Details Update गर्नुहोस्
            </button>
          </div>
        ) : (
          renderContent(rashifal[activeTab])
        )}
      </div>
    </div>
  );
};

export default RashifalPage;
