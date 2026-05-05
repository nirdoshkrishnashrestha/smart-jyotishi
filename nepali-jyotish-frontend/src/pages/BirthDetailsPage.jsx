import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { districts, placesByDistrict } from '../data/nepalLocations';

const nepaliMonths = [
  "Baisakh (वैशाख)", "Jestha (जेठ)", "Ashadh (असार)", "Shrawan (साउन)",
  "Bhadra (भदौ)", "Ashwin (असोज)", "Kartik (कात्तिक)", "Mangsir (मंसिर)",
  "Poush (पुष)", "Magh (माघ)", "Falgun (फागुन)", "Chaitra (चैत)"
];

const rashis = [
  "Mesh (मेष)", "Vrishabha (वृषभ)", "Mithun (मिथुन)", "Karka (कर्कट)",
  "Simha (सिंह)", "Kanya (कन्या)", "Tula (तुला)", "Vrishchik (वृश्चिक)",
  "Dhanu (धनु)", "Makar (मकर)", "Kumbha (कुम्भ)", "Meen (मीन)"
];

const ayanamsaOptions = [
  { value: "LAHIRI", label: "Lahiri (Traditional)" },
  { value: "RAMAN", label: "Raman (Popular)" },
  { value: "SS_REVATI", label: "Surya Siddhanta (Revati)" },
  { value: "SS_CITRA", label: "Surya Siddhanta (Citra)" },
  { value: "YUKTESHWAR", label: "Sri Yukteshwar (Yogic)" },
  { value: "KP", label: "KP (Krishnamurti)" }
];

const fieldClassName = "w-full rounded-lg border border-[#cfd8d3] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(244,248,246,0.96)_100%)] px-4 py-3 text-[#171b22] shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_12px_28px_rgba(22,12,18,0.05)] backdrop-blur-xl transition-all duration-200 focus:outline-none focus:border-[#49b6a6] focus:ring-4 focus:ring-[#49b6a6]/12 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_16px_36px_rgba(73,182,166,0.12)]";
const selectClassName = `${fieldClassName} appearance-none`;
const disabledSelectClassName = `${selectClassName} disabled:opacity-50 disabled:bg-white/50`;

const BirthDetailsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    year: '2050',
    month: '1',
    day: '1',
    time: '12:00',
    district: '',
    exactPlace: '',
    providedRashi: '',
    ayanamsa: 'LAHIRI'
  });
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const res = await api.get('/api/profile/birth-details');
        if (res.data && res.data.status === 'success' && res.data.details) {
          const d = res.data.details;
          const timeStr = `${String(d.birth_hour).padStart(2, '0')}:${String(d.birth_minute).padStart(2, '0')}`;

          let foundDistrict = '';
          if (d.place_of_birth) {
            for (const [dist, places] of Object.entries(placesByDistrict)) {
              if (places.some(p => p.name === d.place_of_birth)) {
                foundDistrict = dist;
                break;
              }
            }
          }

          setFormData({
            year: d.bs_year.toString(),
            month: d.bs_month.toString(),
            day: d.bs_day.toString(),
            time: timeStr,
            district: foundDistrict,
            exactPlace: d.place_of_birth || '',
            providedRashi: d.provided_rashi || '',
            ayanamsa: d.ayanamsa || 'LAHIRI'
          });
        }
      } catch (err) {
        // Safe to ignore
      } finally {
        setInitLoading(false);
      }
    };
    fetchExistingData();
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'district') {
      setFormData({ ...formData, district: e.target.value, exactPlace: '' });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    if (error) setError('');
  };

  const currentPlaces = placesByDistrict[formData.district] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let finalLat = null;
    let finalLng = null;
    let finalPlace = null;

    if (formData.district || formData.exactPlace) {
      if (!formData.district || !districts.some(d => d.en === formData.district)) {
        setError("Please select a valid district from the list, or leave it completely blank.");
        setLoading(false);
        return;
      }
      if (!formData.exactPlace) {
        setError("Please select your birth place within the district.");
        setLoading(false);
        return;
      }
      const placeObj = currentPlaces.find(p => p.name === formData.exactPlace);
      finalLat = placeObj ? placeObj.lat : null;
      finalLng = placeObj ? placeObj.lng : null;
      finalPlace = formData.exactPlace;
    }

    const [hour, minute] = formData.time.split(':').map(Number);

    const payload = {
      bs_year: parseInt(formData.year),
      bs_month: parseInt(formData.month),
      bs_day: parseInt(formData.day),
      birth_hour: hour,
      birth_minute: minute,
      place_of_birth: finalPlace,
      latitude: finalLat,
      longitude: finalLng,
      provided_rashi: formData.providedRashi || null,
      ayanamsa: formData.ayanamsa
    };

    try {
      const response = await api.post('/api/profile/birth-details', payload);
      if (response.data && response.data.status === 'success') {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate cosmic profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Current BS is 2081, so 2082 is a safe upper bound for past/present years.
  const years = Array.from({ length: 151 }, (_, i) => 1932 + i).filter(y => y <= 2082).reverse();
  const days = Array.from({ length: 32 }, (_, i) => i + 1);

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(135deg,#f4f1e9_0%,#fffdf8_42%,#edf7f4_100%)] text-[#20345f] font-bold text-xl animate-pulse">
        Loading previous details...
      </div>
    );
  }

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

      <header className="relative z-20 mx-auto mb-8 flex max-w-6xl items-center justify-between rounded-lg border border-white/75 bg-white/34 px-4 py-3 shadow-[0_16px_55px_rgba(22,12,18,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl">
        <div className="flex items-center gap-3 font-['Cinzel','Times_New_Roman',serif] text-xl font-semibold tracking-[0.08em] text-[#171b22] md:text-2xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c7a24a]/55 bg-white/58 pt-1 font-['Noto_Serif_Devanagari',serif] text-base text-[#8b1d2c] shadow-[inset_0_0_18px_rgba(255,255,255,0.75),0_10px_26px_rgba(22,12,18,0.09)] backdrop-blur-xl">ॐ</span>
          SmartJyotishi
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-lg border border-white/80 bg-white/58 px-4 py-2 text-sm font-black text-[#20345f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/75"
        >
          Dashboard
        </button>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-6 rounded-lg border border-white/80 bg-white/64 p-6 shadow-[0_24px_80px_rgba(22,12,18,0.1),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-2xl md:p-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1f8f84]">Birth Detail Setup</p>
          <h2 className="mb-2 font-['Noto_Serif_Devanagari','Times_New_Roman',serif] text-3xl font-semibold text-[#171b22] md:text-5xl">जन्म विवरण</h2>
          <p className="max-w-3xl text-sm font-medium leading-7 text-[#4e5661] md:text-base">
            तपाईंको कुण्डली सटीक बनाउन जन्म मिति, समय र स्थान ध्यानपूर्वक भर्नुहोस्।
          </p>
        </div>

        <div className="w-full rounded-lg border border-white/80 bg-white/66 p-6 shadow-[0_24px_80px_rgba(22,12,18,0.1),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-2xl md:p-8">

        {error && (
          <div className="mb-6 rounded-lg border border-[#d98a8a]/55 bg-white/72 px-4 py-3 text-[#8b1d2c] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">वि.सं. वर्ष (Year)*</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={selectClassName}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">महिना (Month)*</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className={selectClassName}
              >
                {nepaliMonths.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">गते (Day)*</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                className={selectClassName}
              >
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">जन्म समय (Time)*</label>
              <input
                type="time"
                name="time"
                required
                value={formData.time}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">जन्म जिल्ला*</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={selectClassName}
                required
              >
                <option value="">-- जिल्ला छान्नुहोस् --</option>
                {districts.map((d) => (
                  <option key={d.en} value={d.en}>
                    {d.en} ({d.np})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">जन्म स्थान*</label>
              <select
                name="exactPlace"
                disabled={currentPlaces.length === 0}
                value={formData.exactPlace}
                onChange={handleChange}
                className={disabledSelectClassName}
                required
              >
                <option value="">-- स्थान छान्नुहोस् --</option>
                {currentPlaces.map((p, idx) => (
                  <option key={idx} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">तपाईंको राशी</label>
              <select
                name="providedRashi"
                value={formData.providedRashi}
                onChange={handleChange}
                className={selectClassName}
              >
                <option value="">राशी छान्नुहोस् (यदि थाहा भए)</option>
                {rashis.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-white/70 bg-white/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
            <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#20345f]">Ayanamsa (Calculation System)*</label>
            <select
              name="ayanamsa"
              value={formData.ayanamsa}
              onChange={handleChange}
              className={selectClassName}
            >
              {ayanamsaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-4 mt-8 text-lg font-black transition-all transform ${loading ? 'opacity-75 cursor-not-allowed bg-[#6e7d93]' : 'bg-[#20345f] hover:bg-[#172848] hover:-translate-y-0.5 active:scale-95'} text-white shadow-[0_14px_30px_rgba(32,52,95,0.2)]`}
          >
            {loading ? 'Generating your cosmic profile...' : 'मेरो कुण्डली सुरक्षित गर्नुहोस्'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default BirthDetailsPage;
