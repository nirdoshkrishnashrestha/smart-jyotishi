import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { clearClientSession } from '../auth';

const grahaMapping = {
  "Sun": "सूर्य (Sun)",
  "Moon": "चन्द्र (Moon)",
  "Mars": "मङ्गल (Mars)",
  "Mercury": "बुध (Mercury)",
  "Jupiter": "बृहस्पति (Jupiter)",
  "Venus": "शुक्र (Venus)",
  "Saturn": "शनि (Saturn)",
  "Rahu": "राहु (Rahu)",
  "Ketu": "केतु (Ketu)"
};

const rashiMapping = {
  "Mesh": "मेष (Mesh)",
  "Vrishabha": "वृषभ (Vrishabha)",
  "Mithun": "मिथुन (Mithun)",
  "Karka": "कर्कट (Karka)",
  "Simha": "सिंह (Simha)",
  "Kanya": "कन्या (Kanya)",
  "Tula": "तुला (Tula)",
  "Vrischika": "वृश्चिक (Vrischika)",
  "Dhanu": "धनु (Dhanu)",
  "Makar": "मकर (Makar)",
  "Kumbha": "कुम्भ (Kumbha)",
  "Meen": "मीन (Meen)"
};

const dashaMapping = {
  "Sun": "सूर्य",
  "Moon": "चन्द्र",
  "Mars": "मङ्गल",
  "Mercury": "बुध",
  "Jupiter": "बृहस्पति",
  "Venus": "शुक्र",
  "Saturn": "शनि",
  "Rahu": "राहु",
  "Ketu": "केतु"
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState(null);
  const [planetaryData, setPlanetaryData] = useState(null);
  const [, setAdDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [aiWarning, setAiWarning] = useState(null);
  

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/profile/dashboard');
        if (response.data && response.data.status === 'success') {
          // Check for local overrides first
          const localOverride = localStorage.getItem(`overridden_profile_${response.data.user_name || "current_user"}`);
          if (localOverride) {
            setProfile(JSON.parse(localOverride));
          } else {
            setProfile(response.data.profile);
          }
          
          setPlanetaryData(response.data.planetary_data);
          setAiWarning(response.data.ai_warning || null);
          setAdDate(response.data.ad_date || null);
          
          const name = response.data.user_name || response.data.profile?.full_name || response.data.profile?.name || "";
          setUserName(name);

          // If adDate is missing, try fetching it from birth-details
          if (!response.data.ad_date) {
            try {
              const birthResponse = await api.get('/api/profile/birth-details');
              if (birthResponse.data && birthResponse.data.status === 'success') {
                const details = birthResponse.data.details;
                if (details.ad_date) {
                  setAdDate(details.ad_date);
                } else if (details.bs_year && details.bs_month && details.bs_day) {
                  // Fallback: Simple approximate conversion if backend didn't provide it
                  const yearAd = details.bs_month >= 10 ? details.bs_year - 56 : details.bs_year - 57;
                  const monthAd = (details.bs_month + 3) % 12 || 12;
                  const dayAd = (details.bs_day + 13) % 30 || 30;
                  setAdDate(`${yearAd}-${monthAd}-${dayAd}`);
                }
              }
            } catch (err) {
              console.warn("Could not fetch birth details for AD date", err);
            }
          }

          if (response.data.profile?.error) {
            console.warn("Legacy error-only profile in DB; re-save birth details for full fields.", response.data.profile.error);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("No profile found", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const cleanRashi = (rashi) => {
    if (!rashi) return 'N/A';
    // Remove (method) like (Ss_Citra) or (Calculation)
    const base = rashi.replace(/\s*\(.*?\)\s*/g, '').trim();
    return rashiMapping[base] || base;
  };

  const translateDasha = (dashaStr) => {
    if (!dashaStr || typeof dashaStr !== 'string') return dashaStr;
    
    // If already Nepali, return
    if (dashaStr.includes('महादशा')) return dashaStr;

    let translated = dashaStr;
    // Replace planet names
    Object.entries(dashaMapping).forEach(([en, np]) => {
      translated = translated.replace(new RegExp(en, 'g'), np);
    });
    
    // Replace "Mahadasha" and "(yrs remaining)"
    translated = translated.replace(/Mahadasha/g, 'महादशा');
    translated = translated.replace(/yrs remaining/g, 'वर्ष बाँकी');
    
    return translated;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-[#e6dfd1]">
        <h1 className="text-2xl md:text-3xl font-black text-[#0f1d30] tracking-tight">
          Smart<span className="text-[#b27b4e]">Jyotishi</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-[#3a4a5e] font-medium">स्वागत छ,</p>
            <p className="font-bold text-[#0f1d30]">{userName || "User"}</p>
          </div>
          <div className="relative group inline-block">
            <div className="w-11 h-11 rounded-full bg-[#fdfaf6] border-2 border-[#b27b4e] flex items-center justify-center text-[#0f1d30] font-bold shadow-sm cursor-pointer">
              👤
            </div>

            {/* Dropdown Menu on hover for Sign out */}
            <div className="absolute right-0 top-full pt-2 w-40 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
              <div className="bg-white rounded-md shadow-lg py-1 border border-[#e6dfd1]">
                <button
                  onClick={() => navigate('/contact')}
                  className="block w-full text-left px-4 py-2 text-sm text-[#0f1d30] hover:bg-gray-100 font-bold"
                >
                  Contact
                </button>
                <button
                  onClick={() => {
                    clearClientSession();
                    window.location.replace('/login');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-bold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">

        {/* Welcome Section */}
        <div className="glass-card bg-white p-6 md:p-10 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-l-4 border-l-[#b27b4e]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#b27b4e] opacity-[0.03] rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="mb-6 md:mb-0 relative z-10">
            <h2 className="text-3xl font-bold text-[#0f1d30]">तपाईंको चिना तयार छ</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
            <button
              onClick={() => navigate('/chat')}
              className="w-full md:w-auto whitespace-nowrap px-6 py-3 bg-[#0f1d30] hover:bg-[#1a2f4c] text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(15,29,48,0.2)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Ask SmartJyotishi
            </button>
            <button
              onClick={() => navigate('/birth-details')}
              className="w-full md:w-auto whitespace-nowrap px-6 py-3 bg-white hover:bg-[#fdfaf6] text-[#b27b4e] border-2 border-[#b27b4e] font-bold rounded-xl shadow-[0_8px_20px_rgba(178,123,78,0.1)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              ⚙️ Edit Birth Details
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#b27b4e] font-bold text-xl animate-pulse">Loading cosmic details...</div>
        ) : error || !profile ? (
          <div className="text-center py-20">
            <p className="text-[#3a4a5e] mb-4">You have not created your astrological profile yet.</p>
            <button
              onClick={() => navigate('/birth-details')}
              className="bg-[#b27b4e] hover:bg-[#c98e5e] text-white font-bold py-3 px-6 rounded-lg shadow"
            >
              Generate Astro Profile
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {aiWarning && (
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[#5c4a2e] text-sm md:text-base leading-relaxed"
                role="status"
              >
                {aiWarning}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              {/* Dynamic Rendering of Astro Fields */}
              {Object.entries({
                "राशी": { emoji: "♈", val: cleanRashi(profile["राशी"]), highlight: true },
                "नामको अक्षर": { emoji: "🔤", val: profile["नामको_अक्षर"] || profile["First_Letter"] },
                "लग्न": { emoji: "⬆️", val: profile["लग्न"] },
                "राशी स्वामी": { emoji: "👑", val: profile["राशी_स्वामी"] },
                "वर्तमान महादशा": { emoji: "⏳", val: translateDasha(planetaryData?.Current_Dasha || profile["वर्तमान_दशा"]) },
                "सूर्य राशी": { emoji: "☀️", val: rashiMapping[planetaryData?.Planets?.Sun?.rashi] || profile["सूर्य_राशी"] },
                "नक्षत्र": { emoji: "✨", val: profile["नक्षत्र"] },
                "योग": { emoji: "🕉️", val: profile["योग"] },
                "वर्ण (Varna)": { emoji: "👳‍♂️", val: profile["वर्ण"] },
                "वश्य (Vashya)": { emoji: "🧲", val: profile["वश्य"] },
                "योनी (Yoni)": { emoji: "🐎", val: profile["योनी"] },
                "गण (Gana)": { emoji: "🎭", val: profile["गण"] },
                "नाडी (Nadi)": { emoji: "🧬", val: profile["नाडी"] },
                "उमेर": { emoji: "👤", val: profile["उमेर (Age)"] },
                "जन्म मिति": { emoji: "🗓️", val: profile["जन्म मिति (AD)"] },
                
                "शुभ अङ्क": { emoji: "🔢", val: profile["शुभ_अङ्क"] },
                "अशुभ अङ्क": { emoji: "🛑", val: profile["अशुभ_अङ्क"] },
                
                "शुभ रंग": { emoji: "🎨", val: profile["शुभ_रंग"] },
                "अशुभ रंग": { emoji: "🌈", val: profile["अशुभ_रंग"] },
                
                "शुभ बार": { emoji: "✅", val: profile["शुभ_बार"] },
                "अशुभ बार": { emoji: "❌", val: profile["अशुभ_बार"] },
                
                "शुभ दिशा": { emoji: "🧭", val: profile["शुभ_दिशा"] },
                "अशुभ दिशा": { emoji: "🚫", val: profile["अशुभ_दिशा"] },
              }).map(([label, data], idx) => (
                <div 
                  key={idx} 
                  className={`glass-card p-6 rounded-2xl flex flex-col group transition-all cursor-default border-2 
                    ${data.highlight 
                      ? 'bg-[#fffbeb] border-[#b27b4e] shadow-[0_10px_30px_rgba(178,123,78,0.2)] scale-105 z-10' 
                      : data.isLink
                        ? 'bg-[#f0f4f8] border-[#0f1d30]/20 hover:border-[#0f1d30] hover:shadow-lg cursor-pointer transform hover:-translate-y-1'
                        : 'bg-[#fdfaf6] border-[#e6dfd1] hover:border-[#b27b4e] hover:shadow-md'
                    }`}
                  onClick={data.isLink ? () => navigate(data.path) : undefined}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform shadow-sm 
                    ${data.highlight 
                      ? 'bg-[#b27b4e] text-white border-none' 
                      : 'bg-[#fdfaf6] border border-[#e6dfd1] text-[#0f1d30]'
                    }`}
                  >
                    {data.emoji}
                  </div>
                  <h3 className={`font-semibold text-xs mb-1 uppercase tracking-wider 
                    ${data.highlight ? 'text-[#8e603a]' : 'text-[#3a4a5e]'}`}
                  >
                    {label}
                  </h3>
                  <p className={`text-xl font-bold 
                    ${data.highlight ? 'text-[#0f1d30] text-2xl' : 'text-[#0f1d30]'}`}
                  >
                    {data.val || 'N/A'}
                  </p>
                  {data.highlight && (
                    <div className="absolute top-3 right-3 text-[#b27b4e] animate-pulse">
                      ★
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Planetary Positions Section */}
            {planetaryData && planetaryData.Planets && (
              <div className="glass-card bg-white p-8 rounded-2xl border-t-4 border-t-[#0f1d30]">
                <h2 className="text-2xl font-bold text-[#0f1d30] mb-6 flex items-center gap-2">
                  🪐 ग्रहको स्थिति (Planetary Positions)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#e6dfd1]">
                        <th className="py-4 font-bold text-[#3a4a5e] uppercase text-xs tracking-wider">ग्रह (Graha)</th>
                        <th className="py-4 font-bold text-[#3a4a5e] uppercase text-xs tracking-wider">राशी (Rashi)</th>
                        <th className="py-4 font-bold text-[#3a4a5e] uppercase text-xs tracking-wider">नवांश (Navamsha)</th>
                        <th className="py-4 font-bold text-[#3a4a5e] uppercase text-xs tracking-wider">भाव (House)</th>
                        <th className="py-4 font-bold text-[#3a4a5e] uppercase text-xs tracking-wider">अंश (Degrees)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(planetaryData.Planets).map(([name, data], idx) => (
                        <tr key={idx} className="border-b border-[#fdfaf6] hover:bg-[#fdfaf6] transition-colors">
                          <td className="py-4 font-bold text-[#0f1d30]">{grahaMapping[name] || name}</td>
                          <td className="py-4 text-[#3a4a5e] font-medium">{rashiMapping[data.rashi] || data.rashi}</td>
                          <td className="py-4 text-[#3a4a5e] font-medium">{rashiMapping[data.navamsha_rashi] || data.navamsha_rashi}</td>
                          <td className="py-4 text-[#3a4a5e] font-medium">{data.house}</td>
                          <td className="py-4 text-[#3a4a5e] font-medium">{data.longitude}°</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
