import pathlib

frontend_path = pathlib.Path('/Users/nirdosh/Desktop/claude/nepali-jyotish-frontend/src/pages/BirthDetailsPage.jsx')

if not frontend_path.exists():
    print(f"Error: {frontend_path} does not exist.")
    exit(1)

content = frontend_path.read_text()

# 1. Update formData state
old_form_data = """    district: '',
    exactPlace: '',
    providedRashi: ''
  });"""
new_form_data = """    district: '',
    exactPlace: '',
    providedRashi: '',
    ayanamsa: 'LAHIRI'
  });
  const [ayanamsaOptions, setAyanamsaOptions] = useState([]);"""

content = content.replace(old_form_data, new_form_data)

# 2. Update useEffect to fetch Ayanamsas
old_use_effect = """  useEffect(() => {
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
            providedRashi: d.provided_rashi || ''
          });
        }
      } catch (err) {
        // Safe to ignore
      } finally {
        setInitLoading(false);
      }
    };
    fetchExistingData();
  }, []);"""

new_use_effect = """  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch available ayanamsas
        const ayanamsaRes = await api.get('/api/profile/ayanamsas');
        if (ayanamsaRes.data && ayanamsaRes.data.options) {
          setAyanamsaOptions(ayanamsaRes.data.options);
        }

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

          setFormData(prev => ({
            ...prev,
            year: d.bs_year.toString(),
            month: d.bs_month.toString(),
            day: d.bs_day.toString(),
            time: timeStr,
            district: foundDistrict,
            exactPlace: d.place_of_birth || '',
            providedRashi: d.provided_rashi || '',
            ayanamsa: d.ayanamsa || 'LAHIRI'
          }));
        }
      } catch (err) {
        // Safe to ignore
      } finally {
        setInitLoading(false);
      }
    };
    fetchInitialData();
  }, []);"""

content = content.replace(old_use_effect, new_use_effect)

# 3. Update handleSubmit payload
old_payload = """    const payload = {
      bs_year: parseInt(formData.year),
      bs_month: parseInt(formData.month),
      bs_day: parseInt(formData.day),
      birth_hour: hour,
      birth_minute: minute,
      place_of_birth: finalPlace,
      latitude: finalLat,
      longitude: finalLng,
      provided_rashi: formData.providedRashi || null
    };"""

new_payload = """    const payload = {
      bs_year: parseInt(formData.year),
      bs_month: parseInt(formData.month),
      bs_day: parseInt(formData.day),
      birth_hour: hour,
      birth_minute: minute,
      place_of_birth: finalPlace,
      latitude: finalLat,
      longitude: finalLng,
      provided_rashi: formData.providedRashi || null,
      ayanamsa: formData.ayanamsa || 'LAHIRI'
    };"""

content = content.replace(old_payload, new_payload)

# 4. Add the dropdown to JSX
old_jsx = """              <datalist id="rashi-options">
                {rashis.map(r => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>"""

new_jsx = """              <datalist id="rashi-options">
                {rashis.map(r => (
                  <option key={r} value={r} />
                ))}
              </datalist>
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
          </div>"""

content = content.replace(old_jsx, new_jsx)

frontend_path.write_text(content)
print("Frontend successfully patched.")
