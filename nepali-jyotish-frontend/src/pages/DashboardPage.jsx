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

const cardAccents = [
  'from-[#c7a24a]/38 via-[#49b6a6]/18 to-transparent',
  'from-[#49b6a6]/28 via-[#20345f]/14 to-transparent',
  'from-[#8b1d2c]/22 via-[#c7a24a]/16 to-transparent',
  'from-[#20345f]/22 via-[#49b6a6]/16 to-transparent',
];

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

  const astroFields = profile ? Object.entries({
    "राशी": { emoji: "♈", val: cleanRashi(profile["राशी"]), highlight: true },
    "नामको अक्षर": { emoji: "✺", val: profile["नामको_अक्षर"] || profile["First_Letter"] },
    "लग्न": { emoji: "↑", val: profile["लग्न"] },
    "राशी स्वामी": { emoji: "♔", val: profile["राशी_स्वामी"] },
    "वर्तमान महादशा": { emoji: "◔", val: translateDasha(planetaryData?.Current_Dasha || profile["वर्तमान_दशा"]) },
    "सूर्य राशी": { emoji: "☉", val: rashiMapping[planetaryData?.Planets?.Sun?.rashi] || profile["सूर्य_राशी"] },
    "नक्षत्र": { emoji: "✦", val: profile["नक्षत्र"] },
    "योग": { emoji: "☯", val: profile["योग"] },
    "वर्ण (Varna)": { emoji: "◈", val: profile["वर्ण"] },
    "वश्य (Vashya)": { emoji: "◎", val: profile["वश्य"] },
    "योनी (Yoni)": { emoji: "◐", val: profile["योनी"] },
    "गण (Gana)": { emoji: "✧", val: profile["गण"] },
    "नाडी (Nadi)": { emoji: "≋", val: profile["नाडी"] },
    "उमेर": { emoji: "◷", val: profile["उमेर (Age)"] },
    "जन्म मिति": { emoji: "◫", val: profile["जन्म मिति (AD)"] },
    "शुभ अङ्क": { emoji: "✚", val: profile["शुभ_अङ्क"] },
    "अशुभ अङ्क": { emoji: "✕", val: profile["अशुभ_अङ्क"] },
    "शुभ रंग": { emoji: "◉", val: profile["शुभ_रंग"] },
    "अशुभ रंग": { emoji: "◌", val: profile["अशुभ_रंग"] },
    "शुभ बार": { emoji: "☼", val: profile["शुभ_बार"] },
    "अशुभ बार": { emoji: "☾", val: profile["अशुभ_बार"] },
    "शुभ दिशा": { emoji: "✢", val: profile["शुभ_दिशा"] },
    "अशुभ दिशा": { emoji: "⟡", val: profile["अशुभ_दिशा"] },
  }) : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f4f1e9_0%,#fffdf8_42%,#edf7f4_100%)] px-4 py-5 text-[#171b22] sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 opacity-40 [background-image:linear-gradient(90deg,rgba(22,12,18,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(32,52,95,0.035)_1px,transparent_1px)] [background-size:76px_76px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 opacity-80 [background-image:linear-gradient(120deg,transparent_0_39%,rgba(199,162,74,0.13)_39.12%,transparent_39.3%_100%),linear-gradient(34deg,transparent_0_66%,rgba(73,182,166,0.12)_66.12%,transparent_66.3%_100%)]"
      />
      {/* Header */}
      <header className="relative z-20 mx-auto mb-8 flex max-w-7xl items-center justify-between rounded-lg border border-white/75 bg-white/34 px-4 py-3 shadow-[0_16px_55px_rgba(22,12,18,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl">
        <h1 className="flex items-center gap-3 font-['Cinzel','Times_New_Roman',serif] text-xl font-semibold tracking-[0.08em] text-[#171b22] md:text-2xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c7a24a]/55 bg-white/58 pt-1 font-['Noto_Serif_Devanagari',serif] text-base text-[#8b1d2c] shadow-[inset_0_0_18px_rgba(255,255,255,0.75),0_10px_26px_rgba(22,12,18,0.09)] backdrop-blur-xl">ॐ</span>
          SmartJyotishi
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-[#59606b] font-medium">स्वागत छ,</p>
            <p className="font-bold text-[#171b22]">{userName || "User"}</p>
          </div>
          <div className="group relative inline-block">
            <div className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/65 font-bold text-[#171b22] shadow-[0_12px_30px_rgba(22,12,18,0.11),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
              👤
            </div>

            {/* Dropdown Menu on hover for Sign out */}
            <div className="invisible absolute right-0 top-full z-50 w-40 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="rounded-lg border border-white/80 bg-white/78 py-1 shadow-2xl backdrop-blur-2xl">
                <button
                  onClick={() => navigate('/contact')}
                  className="block w-full px-4 py-2 text-left text-sm font-bold text-[#171b22] hover:bg-white/55"
                >
                  Contact
                </button>
                <button
                  onClick={() => {
                    clearClientSession();
                    window.location.replace('/login');
                  }}
                  className="block w-full px-4 py-2 text-left text-sm font-bold text-[#8b1d2c] hover:bg-white/55"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="relative z-10 mx-auto max-w-7xl space-y-8">

        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/64 p-6 shadow-[0_24px_80px_rgba(22,12,18,0.1),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-2xl md:p-8">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-2/3 opacity-40 [background-image:repeating-linear-gradient(135deg,rgba(32,52,95,0.16)_0_1px,transparent_1px_24px)]"
          />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1f8f84]">Personal Kundali Dashboard</p>
              <h2 className="text-3xl font-semibold leading-tight text-[#171b22] md:text-5xl">तपाईंको चिना तयार छ</h2>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-[#4e5661] md:text-base">
                Your profile is arranged as a compact astrological control center, with the most important signs, dashas, and planetary positions ready to scan.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <button
                onClick={() => navigate('/chat')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#20345f] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(32,52,95,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#172848] active:translate-y-0 md:w-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Ask SmartJyotishi
              </button>
              <button
                onClick={() => navigate('/birth-details')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#49b6a6]/45 bg-white/55 px-6 py-3 text-sm font-black text-[#14695f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_26px_rgba(22,12,18,0.06)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/72 active:translate-y-0 md:w-auto"
              >
                ⚙️ Edit Birth Details
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-white/80 bg-white/62 py-20 text-center text-xl font-bold text-[#20345f] shadow-[0_24px_80px_rgba(22,12,18,0.09),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl animate-pulse">Loading cosmic details...</div>
        ) : error || !profile ? (
          <div className="rounded-lg border border-white/80 bg-white/62 py-20 text-center shadow-[0_24px_80px_rgba(22,12,18,0.09),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl">
            <p className="mb-4 text-[#4e5661]">You have not created your astrological profile yet.</p>
            <button
              onClick={() => navigate('/birth-details')}
              className="rounded-lg bg-[#20345f] px-6 py-3 font-black text-white shadow-[0_14px_30px_rgba(32,52,95,0.2)] hover:bg-[#172848]"
            >
              Generate Astro Profile
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {aiWarning && (
              <div
                className="rounded-lg border border-[#c7a24a]/35 bg-[#fff8df]/72 px-4 py-3 text-sm leading-relaxed text-[#715a20] shadow-[0_10px_32px_rgba(22,12,18,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl md:text-base"
                role="status"
              >
                {aiWarning}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Dynamic Rendering of Astro Fields */}
              {astroFields.map(([label, data], idx) => (
                <div 
                  key={idx} 
                  className={`group relative flex min-h-[154px] cursor-default flex-col overflow-hidden rounded-lg border p-5 shadow-[0_18px_52px_rgba(22,12,18,0.08),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-2xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.58)_0%,transparent_42%,rgba(255,255,255,0.22)_100%)] before:opacity-70 before:transition-opacity hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(22,12,18,0.12)] hover:before:opacity-100
                    ${data.highlight 
                      ? 'border-[#c7a24a]/55 bg-[#fff8df]/74 shadow-[0_22px_70px_rgba(199,162,74,0.13)] sm:col-span-2 lg:col-span-2' 
                      : data.isLink
                        ? 'border-[#49b6a6]/35 bg-white/62 hover:border-[#49b6a6]/70'
                        : 'border-white/80 bg-white/66 hover:border-[#c7a24a]/45'
                    }`}
                  onClick={data.isLink ? () => navigate(data.path) : undefined}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cardAccents[idx % cardAccents.length]}`} />
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-lg border font-['Cinzel','Times_New_Roman',serif] text-[20px] font-black leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_22px_rgba(22,12,18,0.07)] backdrop-blur-xl
                      ${data.highlight
                        ? 'border-[#c7a24a]/45 bg-white/68 text-[#8b1d2c]'
                        : 'border-white/85 bg-white/62 text-[#20345f]'
                      }`}
                    >
                      {data.emoji}
                    </div>
                    {data.highlight && (
                      <span className="relative z-10 rounded-full border border-[#c7a24a]/40 bg-white/58 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b1d2c] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
                        Primary
                      </span>
                    )}
                  </div>
                  <h3 className={`relative z-10 mb-2 text-xs font-black uppercase tracking-[0.14em] 
                    ${data.highlight ? 'text-[#8b1d2c]' : 'text-[#1f8f84]'}
                  `}
                  >
                    {label}
                  </h3>
                  <p className={`relative z-10 break-words font-['Noto_Serif_Devanagari','Times_New_Roman',serif] font-semibold leading-tight 
                    ${data.highlight ? 'text-3xl text-[#171b22]' : 'text-xl text-[#242b34]'}
                  `}
                  >
                    {data.val || 'N/A'}
                  </p>
                </div>
              ))}
            </div>

            {/* Planetary Positions Section */}
            {planetaryData && planetaryData.Planets && (
              <div className="overflow-hidden rounded-lg border border-white/80 bg-white/66 shadow-[0_24px_80px_rgba(22,12,18,0.1),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl">
                <div className="flex flex-col gap-2 border-b border-[#d7d1c6]/70 px-5 py-5 sm:flex-row sm:items-end sm:justify-between md:px-7">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f8f84]">Planetary Matrix</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#171b22]">
                      ग्रहको स्थिति
                    </h2>
                  </div>
                  <p className="text-sm font-medium text-[#5d6570]">Rashi, navamsha, house and degree overview</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#d7d1c6]/70 bg-white/48 backdrop-blur-xl">
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#7a6420]">ग्रह (Graha)</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#7a6420]">राशी (Rashi)</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#7a6420]">नवांश (Navamsha)</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#7a6420]">भाव (House)</th>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#7a6420]">अंश (Degrees)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(planetaryData.Planets).map(([name, data], idx) => (
                        <tr key={idx} className="border-b border-[#d7d1c6]/55 bg-white/18 transition-colors last:border-b-0 hover:bg-[#49b6a6]/12">
                          <td className="px-5 py-4 font-bold text-[#171b22]">{grahaMapping[name] || name}</td>
                          <td className="px-5 py-4 font-medium text-[#4e5661]">{rashiMapping[data.rashi] || data.rashi}</td>
                          <td className="px-5 py-4 font-medium text-[#4e5661]">{rashiMapping[data.navamsha_rashi] || data.navamsha_rashi}</td>
                          <td className="px-5 py-4 font-medium text-[#4e5661]">{data.house}</td>
                          <td className="px-5 py-4 font-bold text-[#14695f]">{data.longitude}°</td>
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
