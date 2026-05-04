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
    return <div className="min-h-screen flex items-center justify-center p-4 text-[#b27b4e] font-bold text-xl animate-pulse">Loading previous details...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl p-8 glass-card relative overflow-hidden bg-white">

        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[radial-gradient(circle,rgba(178,123,78,0.1)_0%,transparent_70%)] rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[radial-gradient(circle,rgba(15,29,48,0.05)_0%,transparent_70%)] rounded-full blur-xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-[#0f1d30] mb-2">जन्म विवरण</h2>
          <p className="text-[#3a4a5e] font-medium">तपाईंको कुण्डली बनाउनको लागि आफ्नो सही जन्म विवरण प्रविष्ट गर्नुहोस्</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative z-10" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">वि.सं. वर्ष (Year)*</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg px-4 py-3 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] shadow-sm appearance-none"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">महिना (Month)*</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg px-4 py-3 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] shadow-sm appearance-none"
              >
                {nepaliMonths.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">गते (Day)*</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg px-4 py-3 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] shadow-sm appearance-none"
              >
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">जन्म समय (Time)*</label>
              <input
                type="time"
                name="time"
                required
                value={formData.time}
                onChange={handleChange}
                className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg px-4 py-3 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">जन्म जिल्ला*</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg p-3 text-[#0f1d30] focus:ring-2 focus:ring-[#b27b4e] focus:border-transparent outline-none transition-all"
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

            <div>
              <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">जन्म स्थान*</label>
              <select
                name="exactPlace"
                disabled={currentPlaces.length === 0}
                value={formData.exactPlace}
                onChange={handleChange}
                className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg px-4 py-3 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] shadow-sm appearance-none disabled:opacity-50 disabled:bg-gray-100"
                required
              >
                <option value="">-- स्थान छान्नुहोस् --</option>
                {currentPlaces.map((p, idx) => (
                  <option key={idx} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">तपाईंको राशी</label>
              <select
                name="providedRashi"
                value={formData.providedRashi}
                onChange={handleChange}
                className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg px-4 py-3 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] shadow-sm appearance-none"
              >
                <option value="">राशी छान्नुहोस् (यदि थाहा भए)</option>
                {rashis.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0f1d30] mb-1.5">Ayanamsa (Calculation System)*</label>
            <select
              name="ayanamsa"
              value={formData.ayanamsa}
              onChange={handleChange}
              className="w-full bg-[#fdfaf6] border border-[#e6dfd1] rounded-lg px-4 py-3 text-[#0f1d30] focus:outline-none focus:border-[#b27b4e] focus:ring-1 focus:ring-[#b27b4e] shadow-sm appearance-none"
            >
              {ayanamsaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? 'opacity-75 cursor-not-allowed bg-[#8e603a]' : 'hover:bg-[#c98e5e] hover:-translate-y-0.5 active:scale-95 bg-[#b27b4e]'} text-white font-bold py-4 rounded-lg mt-8 shadow-[0_6px_20px_rgba(178,123,78,0.25)] transition-all transform text-lg`}
          >
            {loading ? 'Generating your cosmic profile...' : 'मेरो कुण्डली सुरक्षित गर्नुहोस्'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BirthDetailsPage;
