import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Cascader from 'antd/lib/cascader';
import DatePicker from 'antd/lib/date-picker';
import Select from 'antd/lib/select';
import Upload from 'antd/lib/upload';
import type { UploadFile, UploadProps } from 'antd/lib/upload/interface';
import {
  emptyRegistrationFormData,
  isAdultInBeijing,
  isPastDateInBeijing,
  PHOTO_ALLOWED_MIME_TYPES,
  PHOTO_MAX_BYTES,
  PHOTOS_MAX_COUNT,
  type Language,
  type RegistrationFormData,
  validateRegistrationForm,
} from '@/lib/registration';
import { registrationTranslations } from '@/lib/registrationTranslations';
import { supabase } from '@/lib/supabase';

type ErrorMap = Record<string, string>;

interface CityNode {
  code: string;
  name: string;
  name_en: string;
}

interface ProvinceNode {
  code: string;
  name: string;
  name_en: string;
  cities: CityNode[];
}

interface CountryNode {
  code: string;
  name: string;
  name_en: string;
  provinces: ProvinceNode[];
}

interface CitiesData {
  countries: CountryNode[];
}

const MBTI_VALUES = [
  'INTJ',
  'ENTJ',
  'INTP',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
  'unknown',
];

const ZODIAC_VALUES = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const DRAFT_KEY = 'spectrum_registration_draft_v1';
const UPLOAD_LIST_IGNORE = (Upload as any).LIST_IGNORE;

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function ChoiceGroup({
  values,
  selected,
  onChange,
  labels,
  multi = false,
  max,
  noWrap = false,
  containerClassName,
  buttonClassName,
}: {
  values: string[];
  selected: string | string[];
  onChange: (next: string | string[]) => void;
  labels: Record<string, string>;
  multi?: boolean;
  max?: number;
  noWrap?: boolean;
  containerClassName?: string;
  buttonClassName?: string;
}) {
  const selectedSet = new Set(Array.isArray(selected) ? selected : [selected]);
  return (
    <div className={cn('flex gap-2', noWrap ? 'flex-nowrap overflow-x-auto pb-1' : 'flex-wrap', containerClassName)}>
      {values.map((value) => {
        const active = selectedSet.has(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (!multi) {
                onChange(value);
                return;
              }
              const current = Array.isArray(selected) ? selected : [];
              if (active) {
                onChange(current.filter((item) => item !== value));
                return;
              }
              if (max && current.length >= max) return;
              onChange([...current, value]);
            }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition',
              noWrap && 'shrink-0 whitespace-nowrap',
              'rounded-[24px]',
              active
                ? 'border-transparent bg-[#6495ED] text-white shadow-[0_6px_18px_rgba(100,149,237,0.28)]'
                : 'border-[#c8d2e3] bg-white/70 text-[#344057] hover:border-[#9ac6ff]'
              ,
              buttonClassName
            )}
          >
            {labels[value] ?? value}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
  fieldKey,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  fieldKey?: string;
}) {
  return (
    <label id={fieldKey ? `field-${fieldKey}` : undefined} className={cn('block space-y-1.5 rounded-xl', error && 'bg-red-50/60 p-2')}>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#313e55]">
        <span>{label}</span>
      </div>
      {children}
      {error ? <p className="text-xs text-[#d94c7a]">{error}</p> : null}
    </label>
  );
}

const HOBBY_ICONS: Record<string, string> = {
  reading_writing: '📚',
  movies_tv: '🎬',
  music_instruments: '🎵',
  games: '🎮',
  sports_fitness: '🏃',
  travel_food: '🍜',
  photography_art: '📷',
  crafts_baking: '🧁',
  outdoors_camping: '🏕️',
  home_relax: '🛋️',
  custom: '✨',
};

export default function RegistrationPage() {
  const [lang, setLang] = useState<Language>('zh');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegistrationFormData>(emptyRegistrationFormData());
  const [errors, setErrors] = useState<ErrorMap>({});
  const [citiesData, setCitiesData] = useState<CitiesData | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [draggingUid, setDraggingUid] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [tip, setTip] = useState('');

  const t = registrationTranslations[lang];

  const locationOptions = useMemo(
    () =>
      (citiesData?.countries || []).map((country) => {
        const base = {
          value: country.code,
          label: lang === 'zh' ? country.name : country.name_en,
        };
        if (country.code !== 'CN') return base;
        return {
          ...base,
          children: country.provinces.map((province) => ({
            value: province.code,
            label: lang === 'zh' ? province.name : province.name_en,
            children: province.cities.map((city) => ({
              value: city.code,
              label: lang === 'zh' ? city.name : city.name_en,
            })),
          })),
        };
      }),
    [citiesData, lang]
  );

  const cascaderLocationValue = useMemo(() => {
    if (!form.location.country) return [] as string[];
    if (form.location.country !== 'CN') return [form.location.country];
    return [form.location.country, form.location.province || '', form.location.city || ''].filter(Boolean);
  }, [form.location.city, form.location.country, form.location.province]);

  useEffect(() => {
    fetch('/cities.json')
      .then((resp) => resp.json())
      .then((data: CitiesData) => setCitiesData(data))
      .catch(() => setCitiesData({ countries: [] }));
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as RegistrationFormData;
      setForm(parsed);
      setTip(t.restoredDraft);
      setTimeout(() => setTip(''), 2500);
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setTip(t.savedDraft);
    const timer = setTimeout(() => setTip(''), 1200);
    return () => clearTimeout(timer);
  }, [form, t.savedDraft]);

  useEffect(() => {
    // 鑽夌鎭㈠鏃讹紝灏嗗凡淇濆瓨鐨?URL 鏄犲皠涓?Upload 鐨?fileList銆?
    if (fileList.length === 0 && form.photos.length > 0) {
      setFileList(
        form.photos.map((url, index) => ({
          uid: `saved-${index}`,
          name: `photo-${index + 1}.jpg`,
          status: 'done',
          url,
        }))
      );
    }
  }, [fileList.length, form.photos]);

  const setField = <K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateBirthdayNow = (value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, birthday: 'required' }));
      return;
    }
    if (!isPastDateInBeijing(value)) {
      setErrors((prev) => ({ ...prev, birthday: 'past_date' }));
      return;
    }
    if (!isAdultInBeijing(value)) {
      setErrors((prev) => ({ ...prev, birthday: 'adult_only' }));
      return;
    }
    setErrors((prev) => ({ ...prev, birthday: '' }));
  };

  const syncPhotosToForm = (nextFileList: UploadFile[]) => {
    const ordered = nextFileList
      .map((file) => file.url || file.thumbUrl || '')
      .filter((value) => Boolean(value));
    setField('photos', ordered);
  };

  const handleBeforeUpload = (file: File) => {
    if (!PHOTO_ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photos: t.uploadInvalidType }));
      return UPLOAD_LIST_IGNORE;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, photos: t.uploadInvalidSize }));
      return UPLOAD_LIST_IGNORE;
    }
    if (fileList.length >= PHOTOS_MAX_COUNT) {
      return UPLOAD_LIST_IGNORE;
    }
    setErrors((prev) => ({ ...prev, photos: '' }));
    return false;
  };

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: nextFileList }) => {
    const normalized = nextFileList.slice(0, PHOTOS_MAX_COUNT).map((file) => {
      if (!file.url && !file.thumbUrl && file.originFileObj) {
        return { ...file, thumbUrl: URL.createObjectURL(file.originFileObj as File) };
      }
      return file;
    });
    setFileList(normalized);
    syncPhotosToForm(normalized);
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const next = [...fileList];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setFileList(next);
    syncPhotosToForm(next);
  };

  const sanitizePayload = (input: RegistrationFormData) => {
    const payload: RegistrationFormData = {
      ...input,
      location:
        input.location.country === 'CN'
          ? {
              country: input.location.country,
              province: input.location.province || '',
              city: input.location.city || '',
            }
          : { country: input.location.country },
      hobbies_custom: input.hobbies.includes('custom') ? input.hobbies_custom : '',
      color_mood_custom: input.color_mood === 'custom' ? input.color_mood_custom : '',
      scent_memory_custom: input.scent_memory === 'custom' ? input.scent_memory_custom : '',
      ritual_custom: input.ritual === 'custom' ? input.ritual_custom : '',
      valued_traits_custom: input.valued_traits.includes('custom') ? input.valued_traits_custom : '',
    };
    return payload;
  };

  const validateFieldNow = (keys: string[], draftForm?: RegistrationFormData) => {
    const result = validateRegistrationForm(sanitizePayload(draftForm ?? form));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        next[key] = result.errors[key] || '';
      }
      return next;
    });
  };

  const findFirstErrorKey = (errorMap: Record<string, string>) => {
    if (errorMap.location_province || errorMap.location_city) return 'location';
    const ordered = [
      'photos',
      'nickname',
      'birthday',
      'gender',
      'sexual_orientation',
      'location',
      'mbti',
      'zodiac',
      'growth_environment',
      'financial_status',
      'education',
      'pet_preference',
      'hobbies',
      'hobbies_custom',
      'sound_preference',
      'color_mood',
      'color_mood_custom',
      'scent_memory',
      'scent_memory_custom',
      'ritual',
      'ritual_custom',
      'food_adventure',
      'conflict_reaction',
      'recharge_style',
      'mystery_question',
      'mystery_answer',
      'valued_traits',
      'valued_traits_custom',
      'relationship_goal',
      'avatar_filter',
      'contact_info',
      'agree_terms',
    ];
    return ordered.find((key) => Boolean(errorMap[key]));
  };

  const getStepKeys = (currentStep: number, currentForm: RegistrationFormData): string[] => {
    if (currentStep === 0) {
      return [
        'photos',
        'nickname',
        'birthday',
        'gender',
        'sexual_orientation',
        'location',
        ...(currentForm.location.country === 'CN' ? ['location_province', 'location_city'] : []),
        'mbti',
        'zodiac',
        'growth_environment',
        'financial_status',
        'education',
        'pet_preference',
        'hobbies',
        ...(currentForm.hobbies.includes('custom') ? ['hobbies_custom'] : []),
      ];
    }
    if (currentStep === 1) {
      return [
        'sound_preference',
        'color_mood',
        ...(currentForm.color_mood === 'custom' ? ['color_mood_custom'] : []),
        'scent_memory',
        ...(currentForm.scent_memory === 'custom' ? ['scent_memory_custom'] : []),
      ];
    }
    if (currentStep === 2) {
      return ['ritual', ...(currentForm.ritual === 'custom' ? ['ritual_custom'] : []), 'food_adventure'];
    }
    if (currentStep === 3) {
      return ['conflict_reaction', 'recharge_style'];
    }
    if (currentStep === 4) {
      return ['mystery_question', 'mystery_answer'];
    }
    if (currentStep === 5) {
      return ['valued_traits', ...(currentForm.valued_traits.includes('custom') ? ['valued_traits_custom'] : []), 'relationship_goal'];
    }
    return ['avatar_filter', 'contact_info', 'agree_terms'];
  };

  const fullValidation = useMemo(() => validateRegistrationForm(sanitizePayload(form)), [form]);
  const currentStepKeys = useMemo(() => getStepKeys(step, form), [step, form]);
  const canGoNext = currentStepKeys.every((key) => !fullValidation.errors[key]);

  const submit = async () => {
    setSubmitState('submitting');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const orderedPhotoUrls: string[] = [];
      for (const file of fileList) {
        let resolvedUrl = file.url || file.thumbUrl || '';
        if (file.originFileObj) {
          const body = new FormData();
          body.append('file', file.originFileObj as Blob);
          const uploadResp = await fetch('/api/upload', {
            method: 'POST',
            body,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (uploadResp.ok) {
            const uploadResult = (await uploadResp.json()) as { url?: string };
            resolvedUrl = uploadResult.url || resolvedUrl;
          }
        }
        if (resolvedUrl) orderedPhotoUrls.push(resolvedUrl);
      }

      const payload = sanitizePayload({
        ...form,
        photos: orderedPhotoUrls,
      });

      const result = validateRegistrationForm(payload);
      if (!result.isValid) {
        setErrors(result.errors);
        const firstKey = findFirstErrorKey(result.errors);
        if (firstKey) {
          const target = document.getElementById(`field-${firstKey}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        setSubmitState('error');
        return;
      }

      // 褰撳墠椤圭洰鍚庣灏氭湭鍒囨崲鍒版柊 schema锛屽厛杈撳嚭鏈€缁?payload锛屽悗缁鎺ユ柊 API銆?
      // eslint-disable-next-line no-console
      console.log('registration payload', payload);

      setSubmitState('success');
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      setSubmitState('error');
    }
  };

  const validateAndNext = () => {
    setErrors(fullValidation.errors);
    if (step < 6 && canGoNext) {
      setStep((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#fff5ed_0%,#eaf2f8_44%,#dff2ff_100%)] p-4 text-[#25324a] md:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(96,128,167,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(96,128,167,0.12)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,transparent,black_48%,black)] opacity-30" />
      <div className="relative mx-auto max-w-[1182px] rounded-[34px] border border-[#b5c4dd] bg-white/40 p-4 backdrop-blur-2xl shadow-[0_22px_58px_rgba(73,96,132,0.16)] md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-[#303a52]">{t.brand}</h1>
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'zh' ? 'en' : 'zh'))}
            className="rounded-full border border-[#bed0eb] bg-white/70 px-4 py-1.5 text-sm font-semibold text-[#3f4e6f]"
          >
            {t.toggleLang}
          </button>
        </div>

        <p className="mb-5 max-w-4xl text-sm leading-relaxed text-[#3a4662] md:text-[15px]">{t.welcome}</p>

        <div className="mb-6">
          <Field label={t.labels.photos} required error={errors.photos ? t.errors[errors.photos] || errors.photos : ''}>
            <div className="photo-wall">
              <Upload
                accept=".jpg,.jpeg,.png,.heic,.heif,image/jpeg,image/png,image/heic,image/heif"
                listType="picture-card"
                fileList={fileList}
                beforeUpload={handleBeforeUpload}
                onChange={handleUploadChange}
                itemRender={(originNode, file) => {
                  const currentIndex = fileList.findIndex((item) => item.uid === file.uid);
                  return (
                    <div
                      draggable
                      onDragStart={() => setDraggingUid(file.uid)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!draggingUid) return;
                        const fromIndex = fileList.findIndex((item) => item.uid === draggingUid);
                        moveFile(fromIndex, currentIndex);
                        setDraggingUid(null);
                      }}
                      className="cursor-move"
                    >
                      {originNode}
                    </div>
                  );
                }}
              >
                {fileList.length >= PHOTOS_MAX_COUNT ? null : (
                  <button type="button" className="flex h-full w-full flex-col items-center justify-center border-0 bg-transparent">
                    <PlusOutlined style={{ color: '#4658E1' }} />
                    <div className="mt-2 text-xs text-[#4658E1]">Upload</div>
                  </button>
                )}
              </Upload>
            </div>
          </Field>
          <p className="mt-2 text-[14px] text-[#7E8C9D]">{t.photoWallHint}</p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-7">
          {t.sections.map((section, index) => (
            <button
              key={section.title}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                'rounded-2xl border px-3 py-2 text-left transition',
                index === step
                  ? 'border-transparent bg-gradient-to-r from-[#ff9364] via-[#d96cff] to-[#62d7ff] text-white'
                  : 'border-[#cad8ea] bg-white/60'
              )}
            >
              <p className="text-xs font-bold">{index + 1}</p>
              <p className="text-sm font-semibold">{section.title}</p>
            </button>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="rounded-3xl border border-[#c9d6e9] bg-white/70 p-4 shadow-[0_10px_30px_rgba(80,109,151,0.12)] md:p-6"
        >
          <h2 className="text-xl font-bold text-[#33415c]">{t.sections[step].title}</h2>
          <p className="mb-5 mt-1 text-sm text-[#62718f]">{t.sections[step].description}</p>

          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field fieldKey="nickname" label={t.labels.nickname} required error={errors.nickname ? t.errors[errors.nickname] : ''}>
                <input
                  value={form.nickname}
                  onChange={(e) => setField('nickname', e.target.value)}
                  onBlur={() => validateFieldNow(['nickname'])}
                  maxLength={20}
                  placeholder={t.placeholders.nickname}
                  className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                />
              </Field>
              <Field fieldKey="birthday" label={t.labels.birthday} required error={errors.birthday ? t.errors[errors.birthday] : ''}>
                <DatePicker
                  format="YYYY-MM-DD"
                  value={form.birthday ? dayjs(form.birthday, 'YYYY-MM-DD') : null}
                  placeholder={lang === 'zh' ? '请选择' : 'Please select'}
                  onChange={(_, dateString) => {
                    const nextValue = typeof dateString === 'string' ? dateString : '';
                    setField('birthday', nextValue);
                    validateBirthdayNow(nextValue);
                  }}
                  onBlur={() => validateFieldNow(['birthday'])}
                  style={{ width: '100%', height: 42, borderRadius: 12 }}
                  className="border-[#cad7ea] bg-white outline-none ring-[#97c1ff] focus:ring"
                  allowClear
                />
              </Field>

              <Field fieldKey="gender" label={t.labels.gender} required error={errors.gender ? t.errors[errors.gender] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.gender)}
                  selected={form.gender}
                  onChange={(next) => {
                    const nextForm = { ...form, gender: next as string };
                    setForm(nextForm);
                    validateFieldNow(['gender'], nextForm);
                  }}
                  labels={t.options.gender}
                  containerClassName="grid w-full grid-cols-2 md:grid-cols-4"
                  buttonClassName="w-full text-center"
                />
              </Field>

              <Field fieldKey="sexual_orientation" label={t.labels.sexual_orientation} required error={errors.sexual_orientation ? t.errors[errors.sexual_orientation] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.sexual_orientation)}
                  selected={form.sexual_orientation}
                  onChange={(next) => {
                    const nextForm = { ...form, sexual_orientation: next as string };
                    setForm(nextForm);
                    validateFieldNow(['sexual_orientation'], nextForm);
                  }}
                  labels={t.options.sexual_orientation}
                />
              </Field>
              <Field
                fieldKey="location"
                label={lang === 'zh' ? '所在地' : 'Location'}
                required
                error={
                  errors.location
                    ? t.errors[errors.location]
                    : errors.location_province
                    ? t.errors[errors.location_province]
                    : errors.location_city
                    ? t.errors[errors.location_city]
                    : ''
                }
              >
                <Cascader
                  className="location-cascader w-full"
                  style={{ width: '100%' }}
                  options={locationOptions}
                  value={cascaderLocationValue}
                  placeholder={lang === 'zh' ? '请选择' : 'Please select'}
                  onChange={(rawValues) => {
                    const values = (rawValues as string[]) || [];
                    const countryCode = values[0] || '';
                    const nextLocation =
                      countryCode === 'CN'
                        ? {
                            country: countryCode,
                            province: values[1] || '',
                            city: values[2] || '',
                          }
                        : { country: countryCode };
                    const nextForm = { ...form, location: nextLocation };
                    setForm(nextForm);
                    validateFieldNow(['location', 'location_province', 'location_city'], nextForm);
                  }}
                  onBlur={() => validateFieldNow(['location', 'location_province', 'location_city'])}
                />
              </Field>

              <Field fieldKey="mbti" label={t.labels.mbti} required error={errors.mbti ? t.errors[errors.mbti] : ''}>
                <Select
                  className="form-select-ant w-full"
                  style={{ width: '100%' }}
                  value={form.mbti || undefined}
                  placeholder={lang === 'zh' ? '请选择' : 'Please select'}
                  onChange={(value) => setField('mbti', value)}
                  onBlur={() => validateFieldNow(['mbti'])}
                  options={MBTI_VALUES.map((item) => ({
                    value: item,
                    label: item === 'unknown' ? t.options.mbti.unknown : item,
                  }))}
                />
              </Field>

              <Field fieldKey="zodiac" label={t.labels.zodiac} required error={errors.zodiac ? t.errors[errors.zodiac] : ''}>
                <Select
                  className="form-select-ant w-full"
                  style={{ width: '100%' }}
                  value={form.zodiac || undefined}
                  placeholder={lang === 'zh' ? '请选择' : 'Please select'}
                  onChange={(value) => setField('zodiac', value)}
                  onBlur={() => validateFieldNow(['zodiac'])}
                  options={ZODIAC_VALUES.map((item) => ({
                    value: item,
                    label: t.options.zodiac[item],
                  }))}
                />
              </Field>

              <Field fieldKey="growth_environment" label={t.labels.growth_environment} required error={errors.growth_environment ? t.errors[errors.growth_environment] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.growth_environment)}
                  selected={form.growth_environment}
                  onChange={(next) => {
                    const nextForm = { ...form, growth_environment: next as string };
                    setForm(nextForm);
                    validateFieldNow(['growth_environment'], nextForm);
                  }}
                  labels={t.options.growth_environment}
                  containerClassName="grid w-full grid-cols-2 md:grid-cols-4"
                  buttonClassName="w-full text-center"
                />
              </Field>

              <Field fieldKey="financial_status" label={t.labels.financial_status} required error={errors.financial_status ? t.errors[errors.financial_status] : ''}>
                <Select
                  className="form-select-ant w-full"
                  style={{ width: '100%' }}
                  value={form.financial_status || undefined}
                  placeholder={lang === 'zh' ? '请选择' : 'Please select'}
                  onChange={(value) => setField('financial_status', value)}
                  onBlur={() => validateFieldNow(['financial_status'])}
                  options={Object.keys(t.options.financial_status).map((item) => ({
                    value: item,
                    label: t.options.financial_status[item],
                  }))}
                />
              </Field>

              <Field fieldKey="education" label={t.labels.education} required error={errors.education ? t.errors[errors.education] : ''}>
                <Select
                  className="form-select-ant w-full"
                  style={{ width: '100%' }}
                  value={form.education || undefined}
                  placeholder={lang === 'zh' ? '请选择' : 'Please select'}
                  onChange={(value) => setField('education', value)}
                  onBlur={() => validateFieldNow(['education'])}
                  options={Object.keys(t.options.education).map((item) => ({
                    value: item,
                    label: t.options.education[item],
                  }))}
                />
              </Field>

              <div className="md:col-span-2">
                <Field fieldKey="pet_preference" label={t.labels.pet_preference} required error={errors.pet_preference ? t.errors[errors.pet_preference] : ''}>
                  <ChoiceGroup
                    values={Object.keys(t.options.pet_preference)}
                    selected={form.pet_preference}
                    onChange={(next) => {
                      const nextForm = { ...form, pet_preference: next as string };
                      setForm(nextForm);
                      validateFieldNow(['pet_preference'], nextForm);
                    }}
                    labels={t.options.pet_preference}
                    noWrap
                  />
                </Field>
              </div>

              <div id="field-hobbies" className={cn('space-y-2 rounded-xl md:col-span-2', errors.hobbies && 'bg-red-50/60 p-2')}>
                <Field label={t.labels.hobbies} required error={errors.hobbies ? t.errors[errors.hobbies] : ''}>
                  <p className="mb-2 text-xs text-[#7E8C9D]">{lang === 'zh' ? '最多选5项，让TA更了解你' : 'Select up to 5 to help your match know you better'}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {Object.keys(t.options.hobbies).map((value) => {
                      const selected = form.hobbies.includes(value);
                      const disable = !selected && form.hobbies.length >= 5;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={disable}
                          onClick={() => {
                            const next = selected ? form.hobbies.filter((item) => item !== value) : [...form.hobbies, value];
                            const nextForm = { ...form, hobbies: next };
                            setForm(nextForm);
                            validateFieldNow(['hobbies', 'hobbies_custom'], nextForm);
                          }}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition',
                            selected ? 'border-transparent bg-[#6495ED] text-white' : 'border-[#c8d2e3] bg-white/70 text-[#344057]',
                            disable && 'cursor-not-allowed opacity-45'
                          )}
                        >
                          <span>{HOBBY_ICONS[value] || '•'}</span>
                          <span className="text-sm">{t.options.hobbies[value]}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {form.hobbies.includes('custom') ? (
                  <Field fieldKey="hobbies_custom" label={t.labels.hobbies_custom} required error={errors.hobbies_custom ? t.errors[errors.hobbies_custom] : ''}>
                    <input
                      value={form.hobbies_custom}
                      onChange={(e) => setField('hobbies_custom', e.target.value)}
                      onBlur={() => validateFieldNow(['hobbies_custom'])}
                      placeholder={t.placeholders.hobbies_custom}
                      className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                    />
                  </Field>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <Field label={t.labels.sound_preference} required error={errors.sound_preference ? t.errors[errors.sound_preference] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.sound_preference)}
                  selected={form.sound_preference}
                  onChange={(next) => setField('sound_preference', next as string)}
                  labels={t.options.sound_preference}
                />
              </Field>
              <Field label={t.labels.color_mood} required error={errors.color_mood ? t.errors[errors.color_mood] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.color_mood)}
                  selected={form.color_mood}
                  onChange={(next) => setField('color_mood', next as string)}
                  labels={t.options.color_mood}
                />
              </Field>
              {form.color_mood === 'custom' ? (
                <Field label={t.labels.color_mood_custom} required error={errors.color_mood_custom ? t.errors[errors.color_mood_custom] : ''}>
                  <input
                    value={form.color_mood_custom}
                    onChange={(e) => setField('color_mood_custom', e.target.value)}
                    placeholder={t.placeholders.color_mood_custom}
                    className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                  />
                </Field>
              ) : null}

              <Field label={t.labels.scent_memory} required error={errors.scent_memory ? t.errors[errors.scent_memory] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.scent_memory)}
                  selected={form.scent_memory}
                  onChange={(next) => setField('scent_memory', next as string)}
                  labels={t.options.scent_memory}
                />
              </Field>
              {form.scent_memory === 'custom' ? (
                <Field label={t.labels.scent_memory_custom} required error={errors.scent_memory_custom ? t.errors[errors.scent_memory_custom] : ''}>
                  <input
                    value={form.scent_memory_custom}
                    onChange={(e) => setField('scent_memory_custom', e.target.value)}
                    placeholder={t.placeholders.scent_memory_custom}
                    className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <Field label={t.labels.ritual} required error={errors.ritual ? t.errors[errors.ritual] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.ritual)}
                  selected={form.ritual}
                  onChange={(next) => setField('ritual', next as string)}
                  labels={t.options.ritual}
                />
              </Field>
              {form.ritual === 'custom' ? (
                <Field label={t.labels.ritual_custom} required error={errors.ritual_custom ? t.errors[errors.ritual_custom] : ''}>
                  <input
                    value={form.ritual_custom}
                    onChange={(e) => setField('ritual_custom', e.target.value)}
                    placeholder={t.placeholders.ritual_custom}
                    className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                  />
                </Field>
              ) : null}
              <Field label={t.labels.food_adventure} required error={errors.food_adventure ? t.errors[errors.food_adventure] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.food_adventure)}
                  selected={form.food_adventure}
                  onChange={(next) => setField('food_adventure', next as string)}
                  labels={t.options.food_adventure}
                />
              </Field>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="space-y-4">
              <Field label={t.labels.conflict_reaction} required error={errors.conflict_reaction ? t.errors[errors.conflict_reaction] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.conflict_reaction)}
                  selected={form.conflict_reaction}
                  onChange={(next) => setField('conflict_reaction', next as string)}
                  labels={t.options.conflict_reaction}
                />
              </Field>
              <Field label={t.labels.recharge_style} required error={errors.recharge_style ? t.errors[errors.recharge_style] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.recharge_style)}
                  selected={form.recharge_style}
                  onChange={(next) => setField('recharge_style', next as string)}
                  labels={t.options.recharge_style}
                />
              </Field>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <Field label={t.labels.mystery_question} required error={errors.mystery_question ? t.errors[errors.mystery_question] : ''}>
                <input
                  value={form.mystery_question}
                  onChange={(e) => setField('mystery_question', e.target.value)}
                  maxLength={50}
                  placeholder={t.placeholders.mystery_question}
                  className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                />
              </Field>
              <Field label={t.labels.mystery_answer} required error={errors.mystery_answer ? t.errors[errors.mystery_answer] : ''}>
                <textarea
                  value={form.mystery_answer}
                  onChange={(e) => setField('mystery_answer', e.target.value)}
                  maxLength={100}
                  placeholder={t.placeholders.mystery_answer}
                  className="min-h-[92px] w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                />
              </Field>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <Field label={t.labels.valued_traits} required error={errors.valued_traits ? t.errors[errors.valued_traits] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.valued_traits)}
                  selected={form.valued_traits}
                  onChange={(next) => setField('valued_traits', next as string[])}
                  labels={t.options.valued_traits}
                  multi
                  max={3}
                />
              </Field>
              {form.valued_traits.includes('custom') ? (
                <Field label={t.labels.valued_traits_custom} required error={errors.valued_traits_custom ? t.errors[errors.valued_traits_custom] : ''}>
                  <input
                    value={form.valued_traits_custom}
                    onChange={(e) => setField('valued_traits_custom', e.target.value)}
                    placeholder={t.placeholders.valued_traits_custom}
                    className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                  />
                </Field>
              ) : null}
              <Field label={t.labels.relationship_goal} required error={errors.relationship_goal ? t.errors[errors.relationship_goal] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.relationship_goal)}
                  selected={form.relationship_goal}
                  onChange={(next) => setField('relationship_goal', next as string[])}
                  labels={t.options.relationship_goal}
                  multi
                  max={2}
                />
              </Field>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-4">
              <Field label={t.labels.avatar_filter} required error={errors.avatar_filter ? t.errors[errors.avatar_filter] : ''}>
                <ChoiceGroup
                  values={Object.keys(t.options.avatar_filter)}
                  selected={form.avatar_filter}
                  onChange={(next) => setField('avatar_filter', next as string)}
                  labels={t.options.avatar_filter}
                />
              </Field>
              <Field label={t.labels.contact_info} required error={errors.contact_info ? t.errors[errors.contact_info] : ''}>
                <input
                  value={form.contact_info}
                  onChange={(e) => setField('contact_info', e.target.value)}
                  placeholder={t.placeholders.contact_info}
                  className="w-full rounded-xl border border-[#cad7ea] bg-white px-3 py-2.5 outline-none ring-[#97c1ff] focus:ring"
                />
              </Field>
              <label className="flex items-start gap-2 rounded-xl border border-[#cad7ea] bg-white/65 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.agree_terms}
                  onChange={(e) => setField('agree_terms', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#9eb6d5]"
                />
                <span>
                  {t.termsPrefix} {t.termsUser} {t.termsAnd} {t.termsPrivacy}
                </span>
              </label>
              {errors.agree_terms ? <p className="text-xs text-[#d94c7a]">{t.errors.required}</p> : null}
            </div>
          ) : null}
        </motion.div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#5f6e8b]">{tip}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0 || submitState === 'submitting'}
              className="rounded-full border border-[#cad7ea] bg-white/70 px-4 py-2 text-sm disabled:opacity-40"
            >
              {t.prev}
            </button>
            {step < 6 ? (
              <button
                type="button"
                onClick={validateAndNext}
                disabled={!canGoNext || submitState === 'submitting'}
                className="rounded-full bg-gradient-to-r from-[#ff9165] via-[#d76cff] to-[#61d7ff] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t.next}
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitState === 'submitting'}
                className="rounded-full bg-gradient-to-r from-[#ff9165] via-[#d76cff] to-[#61d7ff] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitState === 'submitting' ? t.saving : t.submit}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#c7d6ea] bg-white/55 px-4 py-3 text-sm text-[#4f5f7d]">{t.submitHint}</div>
        {submitState === 'success' ? <p className="mt-3 text-sm text-[#2a8e5b]">{t.submitSuccess}</p> : null}
        {submitState === 'error' ? <p className="mt-3 text-sm text-[#c54a78]">{t.submitFailed}</p> : null}
      </div>
      <style jsx global>{`
        .photo-wall .ant-upload-list {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .photo-wall .ant-upload-list-item-container,
        .photo-wall .ant-upload.ant-upload-select {
          position: relative !important;
          overflow: hidden !important;
          width: 120px !important;
          height: 120px !important;
          min-width: 120px !important;
          min-height: 120px !important;
          max-width: 120px !important;
          max-height: 120px !important;
          flex: 0 0 120px !important;
          margin: 0 !important;
          border-radius: 12px;
        }
        .photo-wall .ant-upload.ant-upload-select {
          border: 1px dashed #a8d5e5;
          background: #e8f0f8;
        }
        .photo-wall .ant-upload-list-item {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 12px;
          overflow: hidden;
        }
        .photo-wall .ant-upload-list-item-actions {
          pointer-events: none !important;
        }
        .photo-wall .ant-upload-list-item-actions a,
        .photo-wall .ant-upload-list-item-actions button,
        .photo-wall .ant-upload-list-item-actions .anticon {
          pointer-events: auto !important;
        }
        .photo-wall .ant-upload-list-item-thumbnail,
        .photo-wall .ant-upload-list-item-thumbnail img,
        .photo-wall .ant-upload-list-item-image {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        .location-cascader .ant-select-selector {
          height: 42px !important;
          border-radius: 12px !important;
          border-color: #cad7ea !important;
          background: #fff !important;
          padding: 0 12px !important;
          display: flex !important;
          align-items: center !important;
        }
        .location-cascader .ant-select-selection-placeholder,
        .location-cascader .ant-select-selection-item {
          line-height: 40px !important;
        }
        .form-select-ant .ant-select-selector {
          height: 42px !important;
          border-radius: 12px !important;
          border-color: #cad7ea !important;
          background: #fff !important;
          padding: 0 12px !important;
          display: flex !important;
          align-items: center !important;
        }
        .form-select-ant .ant-select-selection-placeholder,
        .form-select-ant .ant-select-selection-item {
          line-height: 40px !important;
        }
        .form-select-ant .ant-select-selection-search-input {
          height: 40px !important;
        }
        @media (max-width: 768px) {
          .photo-wall .ant-upload-list-item-container,
          .photo-wall .ant-upload.ant-upload-select {
            width: 100px !important;
            height: 100px !important;
            min-width: 100px !important;
            min-height: 100px !important;
            max-width: 100px !important;
            max-height: 100px !important;
            flex: 0 0 100px !important;
          }
        }
      `}</style>
    </div>
  );
}

