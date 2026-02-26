// pages/index.tsx
// 主页面，根据用户状态显示落地页、注册表单或仪表盘

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { translations } from '@/lib/translations';
import { uploadProfilePhoto } from '@/lib/storage';
import { generateDailyClues } from '@/lib/ai'; // 仅用于测试，实际在 API 中调用
import {
  Heart, Globe, User, Shield, Clock, MessageCircle, X,
  ChevronRight, ChevronLeft, Sparkles, Zap, Lock, Eye, Camera
} from 'lucide-react';
import Select from '@/components/Select';
import { fetchCountries, fetchStates, fetchCities } from '@/lib/locationApi';

// 语言切换组件
const LanguageToggle = ({ lang, setLang, t }: any) => (
  <button
    onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
    className="flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-black/20 hover:bg-pink-500/10 transition-all"
  >
    <Globe size={14} className="text-pink-400" />
    <span className="text-xs font-medium tracking-widest text-pink-100">{t.toggleLang}</span>
  </button>
);

export default function Home({ session: initialSession }: any) {
  const router = useRouter();
  const [lang, setLang] = useState<'en'|'zh'>('zh');
  const [view, setView] = useState<'landing'|'onboarding'|'dashboard'>('landing');
  const [step, setStep] = useState(0);
  const [session, setSession] = useState(initialSession);
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState({
    countries: false,
    states: false,
    cities: false,
  });
  const t = translations[lang];

// 表单数据（注册用）
const [formData, setFormData] = useState({
  mbti: '', zodiac: '', pet: '', country: '', city: '', role: '',
  family: '', loveStyles: [] as string[], dynamics: [] as string[],
  idealTypeTags: [] as string[], idealTypeText: '', workIndustry: '',
  financialStatus: '', familyViews: '', loveViews: '', favoriteQuote: '',
  preferredContact: '', preferredDynamicIRL: '', photo: null as File | null,
  looksFilter: true, age: undefined as number | undefined,  countryId: '',  // 新增：国家ID
  stateId: '',    // 新增：州/省ID
  cityId: '',     // 新增：城市ID
  // 保留原文字段用于显示
  countryName: '',
  stateName: '',
  cityName: '',
});

// 组件加载时获取国家列表
useEffect(() => {
  const loadCountries = async () => {
    setLoadingLocations(prev => ({ ...prev, countries: true }));
    const data = await fetchCountries();
    setCountries(data);
    setLoadingLocations(prev => ({ ...prev, countries: false }));
  };
  loadCountries();
}, []);

// 当国家改变时，获取对应的州/省
useEffect(() => {
  if (!formData.countryId) {
    setStates([]);
    setCities([]);
    return;
  }

  const loadStates = async () => {
    setLoadingLocations(prev => ({ ...prev, states: true }));
    const data = await fetchStates(Number(formData.countryId));
    setStates(data);
    setLoadingLocations(prev => ({ ...prev, states: false }));
  };
  loadStates();
}, [formData.countryId]);

// 当州改变时，获取对应的城市
useEffect(() => {
  if (!formData.stateId) {
    setCities([]);
    return;
  }

  const loadCities = async () => {
    setLoadingLocations(prev => ({ ...prev, cities: true }));
    const data = await fetchCities(Number(formData.stateId));
    setCities(data);
    setLoadingLocations(prev => ({ ...prev, cities: false }));
  };
  loadCities();
}, [formData.stateId]);



  // 检查认证状态和资料
  useEffect(() => {
    if (!session) {
      setView('landing');
      setLoading(false);
      return;
    }

    // 获取用户资料
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        setView('onboarding');
      } else if (data) {
        setProfile(data);
        setView('dashboard');
        // 获取匹配列表
        fetchMatches();
      } else {
        setView('onboarding');
      }
      setLoading(false);
    };

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .eq('status', 'active');

      if (!error && data) {
        // 整理数据，确定对方信息
        const formatted = data.map((match: any) => {
          const isUser1 = match.user1_id === session.user.id;
          const otherUser = isUser1 ? match.user2 : match.user1;
          return {
            ...match,
            otherUser,
            // 确保线索字段是数组（兼容数据库可能存的是 JSON 字符串）
            day1_clues: typeof match.day1_clues === 'string' ? JSON.parse(match.day1_clues) : (match.day1_clues || []),
            day2_clues: typeof match.day2_clues === 'string' ? JSON.parse(match.day2_clues) : (match.day2_clues || []),
            day3_clues: typeof match.day3_clues === 'string' ? JSON.parse(match.day3_clues) : (match.day3_clues || []),
            day4_clues: typeof match.day4_clues === 'string' ? JSON.parse(match.day4_clues) : (match.day4_clues || []),
          };
        });
        setMatches(formatted);
      }
    };

    fetchProfile();
  }, [session]);

  // 如果正在加载，显示加载动画
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // ---------- Landing 视图 ----------
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

        <header className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center w-full max-w-6xl mx-auto">
          <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            {t.brand}
          </div>
          <LanguageToggle lang={lang} setLang={setLang} t={t} />
        </header>

        <div className="text-center z-10 space-y-8">
          <h1 className="text-5xl md:text-7xl font-light tracking-tight">
            {t.tagline.split(',')[0]}<br />
            <span className="font-bold italic text-pink-500">{t.tagline.split(',')[1]}</span>
          </h1>
          <button
            onClick={() => router.push('/auth/signin')}
            className="group relative px-10 py-4 bg-white text-black font-bold rounded-full overflow-hidden hover:scale-105 transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 group-hover:text-white transition-colors">{t.getStarted}</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------- Onboarding 视图 ----------
  if (view === 'onboarding') {
    const currentStepTitle = t.steps[step];

    const toggleDynamic = (item: string) => {
      setFormData(prev => ({
        ...prev,
        dynamics: prev.dynamics.includes(item)
          ? prev.dynamics.filter(d => d !== item)
          : [...prev.dynamics, item]
      }));
    };

    const toggleLoveStyle = (style: string) => {
      setFormData(prev => ({
        ...prev,
        loveStyles: prev.loveStyles.includes(style)
          ? prev.loveStyles.filter(s => s !== style)
          : [...prev.loveStyles, style]
      }));
    };

    const handleComplete = async () => {
      if (!session?.user) return;

      try {
        // 上传照片（如果有）
        let photoUrl = '';
        if (formData.photo) {
          photoUrl = await uploadProfilePhoto(formData.photo, session.user.id);
        }

        // 保存资料到 Supabase
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id,
          age: formData.age,
          mbti: formData.mbti,
          zodiac: formData.zodiac,
          pet: formData.pet,
          country: formData.countryName,  // 保存国家名称用于显示
          city: formData.cityName,        // 保存城市名称
          // 也可以同时保存 ID 供后续使用
          country_id: formData.countryId,
          city_id: formData.cityId,
          role: formData.role,
          family_background: formData.family,
          love_styles: formData.loveStyles,
          preferred_dynamics: formData.dynamics,
          ideal_type_tags: formData.idealTypeTags,
          ideal_type_text: formData.idealTypeText,
          work_industry: formData.workIndustry,
          financial_status: formData.financialStatus,
          family_views: formData.familyViews,
          love_views: formData.loveViews,
          favorite_quote: formData.favoriteQuote,
          preferred_contact: formData.preferredContact,
          preferred_dynamic_irl: formData.preferredDynamicIRL,
          profile_photo_url: photoUrl,
          cartoon_photo_url: photoUrl, // 实际应生成卡通版本，这里简化
          looks_filter_enabled: formData.looksFilter,
        });

        if (error) throw error;
        setView('dashboard');
      } catch (err) {
        console.error('Save profile error:', err);
        alert('保存失败，请重试');
      }
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-xl">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-12">
            <span className="text-xs uppercase tracking-[0.3em] text-pink-500 font-bold">{currentStepTitle}</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-pink-500' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-8">
            {/* 步骤0：基本信息 */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/50">{t.labels.age}</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-pink-500"
                    placeholder="18"
                  />
                </div>
                
                <Select
                  label={t.labels.mbti}
                  options={[
                    { value: '', label: 'Select...' },
                    ...t.options.mbti.map(opt => ({ value: opt, label: opt }))
                  ]}
                  value={formData.mbti}
                  onChange={(val) => setFormData({ ...formData, mbti: val })}
                  placeholder="Select..."
                />

                <Select
                  label={t.labels.zodiac}
                  options={[
                    { value: '', label: 'Select...' },
                    ...['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(s => ({
                      value: s,
                      label: s
                    }))
                  ]}
                  value={formData.zodiac}
                  onChange={(val) => setFormData({ ...formData, zodiac: val })}
                  placeholder="Select..."
                />

                {/* 国家下拉框 */}
                <Select
                  label={t.labels.country}
                  options={[
                    { value: '', label: 'Select country' },
                    ...countries.map(c => ({ value: c.id.toString(), label: c.name }))
                  ]}
                  value={formData.countryId}
                  onChange={(val) => {
                    const selected = countries.find(c => c.id.toString() === val);
                    setFormData({
                      ...formData,
                      countryId: val,
                      countryName: selected?.name || '',
                      stateId: '',  // 清空下级
                      cityId: '',
                    });
                  }}
                  disabled={loadingLocations.countries}
                />

                {/* 州/省下拉框 */}
                <Select
                  label="State/Province"
                  options={[
                    { value: '', label: 'Select state' },
                    ...states.map(s => ({ value: s.id.toString(), label: s.name }))
                  ]}
                  value={formData.stateId}
                  onChange={(val) => {
                    const selected = states.find(s => s.id.toString() === val);
                    setFormData({
                      ...formData,
                      stateId: val,
                      stateName: selected?.name || '',
                      cityId: '',
                    });
                  }}
                  disabled={!formData.countryId || loadingLocations.states}
                />

                {/* 城市下拉框 */}
                <Select
                  label={t.labels.city}
                  options={[
                    { value: '', label: 'Select city' },
                    ...cities.map(c => ({ value: c.id.toString(), label: c.name }))
                  ]}
                  value={formData.cityId}
                  onChange={(val) => {
                    const selected = cities.find(c => c.id.toString() === val);
                    setFormData({
                      ...formData,
                      cityId: val,
                      cityName: selected?.name || '',
                    });
                  }}
                  disabled={!formData.stateId || loadingLocations.cities}
                />

                <div className="space-y-2">
                  <label className="text-xs text-white/50">{t.labels.role}</label>
                  <div className="flex gap-2">
                    {t.options.roles.map(role => (
                      <button
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex-1 p-3 rounded-xl border transition-all ${formData.role === role ? 'border-pink-500 bg-pink-500/20' : 'border-white/10 bg-white/5'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 步骤1：价值观 */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/50">{t.labels.family}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {t.options.family.map(f => (
                      <button
                        key={f}
                        onClick={() => setFormData({ ...formData, family: f })}
                        className={`text-left p-4 rounded-xl border transition-all ${formData.family === f ? 'border-pink-500 bg-pink-500/20' : 'border-white/10 bg-white/5'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/50">{t.labels.loveStyle}</label>
                  <div className="flex flex-wrap gap-2">
                    {t.options.loveStyle.map(style => (
                      <button
                        key={style}
                        onClick={() => toggleLoveStyle(style)}
                        className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.loveStyles.includes(style) ? 'border-pink-500 bg-pink-500 text-white' : 'border-white/10 bg-white/5 text-white/70'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 步骤2：相处模式 */}
            {step === 2 && (
              <div className="space-y-6">
                <label className="text-xs text-white/50 block">{t.labels.dynamics}</label>
                <div className="flex flex-wrap gap-2">
                  {t.options.dynamics.map(dyn => (
                    <button
                      key={dyn}
                      onClick={() => toggleDynamic(dyn)}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${formData.dynamics.includes(dyn) ? 'border-pink-500 bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-white/10 bg-white/5 text-white/70'}`}
                    >
                      {dyn}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/50">{t.labels.idealType}</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-pink-500"
                    placeholder="e.g., 长发, 运动型, 文艺"
                    value={formData.idealTypeText}
                    onChange={(e) => setFormData({ ...formData, idealTypeText: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 步骤3：照片 */}
            {step === 3 && (
              <div className="space-y-8 text-center">
                <div className="w-48 h-48 mx-auto rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center bg-white/5 relative overflow-hidden">
                  {formData.photo ? (
                    <img src={URL.createObjectURL(formData.photo)} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <>
                      <Camera size={40} className="text-white/20 mb-2" />
                      <span className="text-xs text-white/30 px-4">Tap to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setFormData({ ...formData, photo: e.target.files[0] });
                          }
                        }}
                      />
                    </>
                  )}
                </div>

                <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4 flex items-center gap-4 text-left">
                  <Shield className="text-pink-400 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-pink-300">{t.labels.looksFilter}</h4>
                    <p className="text-xs text-pink-300/60 leading-relaxed">Your real photo will be replaced with a stylized version until Day 5.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.looksFilter}
                    onChange={(e) => setFormData({ ...formData, looksFilter: e.target.checked })}
                    className="accent-pink-500 h-5 w-5"
                  />
                </div>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex gap-4 pt-4">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="mx-auto" />
                </button>
              )}
              <button
                onClick={() => step < 3 ? setStep(step + 1) : handleComplete()}
                className="flex-[3] p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold hover:opacity-90 transition-opacity"
              >
                {step === 3 ? (lang === 'en' ? 'Complete Profile' : '完成') : <ChevronRight className="mx-auto" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Dashboard 视图 ----------
  if (view === 'dashboard') {
    // 假设当前只展示第一个匹配（实际应有列表，为简化此处只展示一个）
    const activeMatch = matches[0];

    if (!activeMatch) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center">
          <p className="text-white/50 mb-4">暂无匹配，去发现新朋友吧！</p>
          <button className="px-6 py-3 rounded-full bg-pink-500 text-white font-bold">
            发现匹配
          </button>
        </div>
      );
    }

    const isRevealed = activeMatch.current_day >= 5;
    const blurAmount = Math.max(0, 50 - (activeMatch.current_day * 10));

    // 收集当前天之前的所有线索
    const cluesToShow: string[] = [];
    if (activeMatch.current_day >= 1) cluesToShow.push(...(activeMatch.day1_clues || []));
    if (activeMatch.current_day >= 2) cluesToShow.push(...(activeMatch.day2_clues || []));
    if (activeMatch.current_day >= 3) cluesToShow.push(...(activeMatch.day3_clues || []));
    if (activeMatch.current_day >= 4) cluesToShow.push(...(activeMatch.day4_clues || []));

    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col">
        {/* 导航栏 */}
        <nav className="p-6 border-b border-white/5 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
          <div className="font-black text-xl tracking-tighter text-pink-500">{t.brand}</div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                {t.labels.matchLimit}: {profile?.matches_used_this_week || 0}/5
              </span>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} t={t} />
          </div>
        </nav>

        <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            {/* 左侧：揭晓卡片 */}
            <div className="space-y-6">
              <div className="relative group rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 aspect-[4/5] md:aspect-auto md:h-[600px] shadow-2xl">
                {/* 照片（使用对方真实照片或卡通） */}
                <img
                  src={activeMatch.otherUser?.profile_photo_url || 'https://via.placeholder.com/400'}
                  className="w-full h-full object-cover transition-all duration-1000"
                  style={{ filter: isRevealed ? 'none' : `blur(${blurAmount}px) grayscale(0.5)` }}
                />

                {/* 覆盖层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-6 left-6 flex gap-2">
                  <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center gap-2">
                    <Clock size={16} className="text-pink-500 animate-pulse" />
                    <span className="text-sm font-bold">{t.dashboard.revealDay} {activeMatch.current_day} / 5</span>
                  </div>
                </div>

                <div className="absolute bottom-10 left-10 right-10 space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight">
                    {isRevealed ? activeMatch.otherUser?.username : 'Match #' + activeMatch.id.slice(0, 4)}
                  </h2>

                  {/* 显示所有已解锁线索 */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {cluesToShow.map((clue, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-sm italic leading-relaxed text-white/90">"{clue}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：交互面板 */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-6 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold uppercase tracking-widest text-xs text-white/50">{t.dashboard.clueTitle}</h3>
                  <Zap size={16} className="text-yellow-500" />
                </div>

                <div className="space-y-4">
                  {/* 联系方式（第5天解锁） */}
                  <div className={`p-4 rounded-2xl border transition-all ${isRevealed ? 'bg-pink-500/20 border-pink-500/50' : 'bg-white/5 border-white/10 opacity-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {isRevealed ? <Eye size={18} className="text-pink-400" /> : <Lock size={18} />}
                      <span className="text-sm font-bold">{t.labels.contact}</span>
                    </div>
                    <p className="font-mono text-lg">{isRevealed ? activeMatch.otherUser?.preferred_contact : '********'}</p>
                    {!isRevealed && <p className="text-[10px] text-white/40 mt-1">{t.dashboard.locked}</p>}
                  </div>

                  {/* 已解锁的部分信息（MBTI、属性等） */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] block text-white/30 mb-1">{t.labels.mbti}</span>
                      <span className="font-bold">{isRevealed ? activeMatch.otherUser?.mbti : '???'}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] block text-white/30 mb-1">{t.labels.role}</span>
                      <span className="font-bold">{isRevealed ? activeMatch.otherUser?.role : '???'}</span>
                    </div>
                  </div>
                </div>

                <button className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center gap-3 hover:bg-white/20 transition-all">
                  <MessageCircle size={20} className="text-pink-400" />
                  <span className="font-bold">{t.dashboard.sendMsg}</span>
                </button>
              </div>

              <button className="w-full py-4 rounded-2xl border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all">
                {t.dashboard.terminate}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  return null;
}