import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Avatar from 'antd/lib/avatar';
import Badge from 'antd/lib/badge';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Collapse from 'antd/lib/collapse';
import ConfigProvider from 'antd/lib/config-provider';
import Drawer from 'antd/lib/drawer';
import Dropdown from 'antd/lib/dropdown';
import Empty from 'antd/lib/empty';
import Image from 'antd/lib/image';
import Input from 'antd/lib/input';
import List from 'antd/lib/list';
import Modal from 'antd/lib/modal';
import Progress from 'antd/lib/progress';
import Space from 'antd/lib/space';
import Tag from 'antd/lib/tag';
import Tooltip from 'antd/lib/tooltip';
import Typography from 'antd/lib/typography';
import notification from 'antd/lib/notification';
import {
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
  EditOutlined,
  GlobalOutlined,
  LogoutOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { supabase } from '@/lib/supabase';
import { matchingTranslations } from '@/lib/matchingTranslations';

type Lang = 'zh' | 'en';
const { Text, Title } = Typography;

interface QuotaInfo {
  used: number;
  total: number;
  remaining: number;
  start: string;
  end: string;
}

interface NotificationItem {
  id: string;
  created_at: string;
  expires_at: string;
  fromUser: {
    id: string;
    nickname: string;
    profile_photo_url?: string;
  };
}

interface MatchItem {
  id: string;
  isDeductedSide: boolean;
  current_day: number;
  created_at: string;
  trial_ends_at: string;
  isInTrialPeriod: boolean;
  next_unlock_at: string;
  match_source: string;
  day1_clues: string[];
  day2_clues: string[];
  day3_clues: string[];
  day4_clues: string[];
  otherUser: {
    id: string;
    nickname: string;
    mbti?: string;
    sexual_orientation?: string;
    photos?: string[];
    profile_photo_url?: string;
    contact_info?: string;
  };
}

interface MessageItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { nickname?: string; username?: string };
  message_window_key?: string;
}

interface DashboardPayload {
  serverTime: string;
  quota: QuotaInfo;
  me?: {
    id: string;
    nickname: string;
    profile_photo_url?: string;
    photos?: string[];
  };
  notifications: NotificationItem[];
  matches: MatchItem[];
}

function formatDate(input: string, lang: Lang) {
  return new Date(input).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildWindowKey(serverTimeIso: string) {
  const d = new Date(new Date(serverTimeIso).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  if (d.getHours() < 8) d.setDate(d.getDate() - 1);
  d.setHours(8, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}_08:00+08`;
}

function sourceLabel(source: string, lang: Lang) {
  if (source === 'realtime') return lang === 'zh' ? matchingTranslations.zh.sourceSync : matchingTranslations.en.sourceSync;
  return lang === 'zh' ? matchingTranslations.zh.sourceInvite : matchingTranslations.en.sourceInvite;
}

function getExpireText(expiresAt: string, lang: Lang) {
  const t = matchingTranslations[lang];
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return t.expired;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours <= 0) return t.expiresSoon;
  return t.expiresIn(hours);
}

function getUnlockTimeForDay(nextUnlockAtIso: string, currentDay: number, dayNumber: number) {
  const unlock = new Date(nextUnlockAtIso);
  const offset = dayNumber - Math.max(1, currentDay + 1);
  if (offset > 0) {
    unlock.setDate(unlock.getDate() + offset);
  }
  return unlock.toISOString();
}

export default function MatchingDashboard({ lang, onToggleLang }: { lang: Lang; onToggleLang: () => void }) {
  const router = useRouter();
  const t = matchingTranslations[lang];
  const [notifyApi, notifyCtx] = notification.useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myUserId, setMyUserId] = useState('');
  const langRef = useRef<Lang>(lang);
  const cardClass =
    'border border-[#E5E9F0] bg-[linear-gradient(180deg,#E8F0F8_0%,#FFFFFF_100%)] shadow-[0_8px_24px_rgba(45,62,80,0.06)]';
  const subCardClass =
    'border border-[#E5E9F0] bg-[linear-gradient(180deg,rgba(168,213,229,0.08)_0%,#FFFFFF_100%)] shadow-[0_6px_18px_rgba(45,62,80,0.05)]';

  const loadDashboard = async () => {
    try {
      setError('');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      const resp = await fetch(`/api/matches?lang=${langRef.current}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(t.loadFailed);
      const payload: DashboardPayload = await resp.json();
      setData(payload);

      const hashId = (window.location.hash || '').replace('#match-', '');
      const exists = payload.matches.some((m) => m.id === hashId);
      const nextId = exists ? hashId : payload.matches[0]?.id || '';
      setSelectedId((prev) => (prev && payload.matches.some((m) => m.id === prev) ? prev : nextId));
    } catch {
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (matchId: string) => {
    if (!matchId) return;
    const { data: rows, error: qError } = await supabase
      .from('messages')
      .select('id,sender_id,content,created_at,message_window_key,sender:profiles!messages_sender_id_fkey(nickname)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (!qError) setMessages((rows as MessageItem[]) || []);
  };

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => setMyUserId(u.user?.id || ''));
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) window.location.hash = `match-${selectedId}`;
  }, [selectedId]);

  const selectedMatch = useMemo(() => data?.matches.find((m) => m.id === selectedId) || null, [data, selectedId]);
  const dayPacks = useMemo(
    () => (selectedMatch ? [selectedMatch.day1_clues || [], selectedMatch.day2_clues || [], selectedMatch.day3_clues || [], selectedMatch.day4_clues || []] : []),
    [selectedMatch]
  );
  const hasSentToday = useMemo(() => {
    if (!data?.serverTime || !myUserId) return false;
    const key = buildWindowKey(data.serverTime);
    return messages.some((m) => m.sender_id === myUserId && m.message_window_key === key);
  }, [data?.serverTime, myUserId, messages]);
  const addMatchDisabled = submitting || (data?.quota.remaining || 0) <= 0;
  const selectedPhotos = selectedMatch?.otherUser.photos || [];
  const unlockedCount = Math.min(selectedPhotos.length, selectedMatch?.current_day || 0);
  const unlockedPhotos = selectedPhotos.slice(0, unlockedCount);

  const openError = (title: string, msg: string) => {
    notifyApi.error({ message: title, description: msg });
  };

  const sendMessage = async () => {
    if (!selectedMatch || !messageText.trim() || messageText.length > 200) return;
    try {
      setSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const resp = await fetch(`/api/matches/${selectedMatch.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: messageText.trim() }),
      });
      if (!resp.ok) throw new Error(t.sendFailed);
      setMessageText('');
      await loadMessages(selectedMatch.id);
      await loadDashboard();
    } catch {
      openError(t.messageTitle, t.sendFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const requestMatch = async () => {
    try {
      setSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const resp = await fetch('/api/matches/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(body.error || t.actionFailed);
      notifyApi.success({ message: t.createMatch, description: t.invited });
      await loadDashboard();
    } catch (e: any) {
      const rawMessage = String(e?.message || '');
      const isNoCandidate = rawMessage.toLowerCase().includes('no new matches available');
      openError(t.createMatch, isNoCandidate ? t.noCandidate : rawMessage || t.actionFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const respondInvite = async (requestId: string, accept: boolean) => {
    try {
      setSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const resp = await fetch('/api/matches/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, accept }),
      });
      if (!resp.ok) throw new Error(t.actionFailed);
      await loadDashboard();
    } catch {
      openError(t.notifTitle, t.actionFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const terminateMatch = async () => {
    if (!selectedMatch || !data?.quota) return;
    const confirmContent = !selectedMatch.isDeductedSide
      ? t.confirmTerminateTrip
      : selectedMatch.isInTrialPeriod
      ? t.endingTrial
      : t.endingNormal(data.quota.remaining);
    Modal.confirm({
      title: t.endMatch,
      content: confirmContent,
      okText: t.endMatch,
      cancelText: t.cancel,
      okButtonProps: { danger: true },
      async onOk() {
        try {
          setSubmitting(true);
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) return;
          const resp = await fetch(`/api/matches/${selectedMatch.id}/terminate`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resp.ok) throw new Error(t.actionFailed);
          await loadDashboard();
        } catch {
          openError(t.endMatch, t.actionFailed);
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const menuItems = [
    { key: 'profile', icon: <EditOutlined />, label: t.profile, onClick: () => router.push('/register?mode=edit') },
    { key: 'lang', icon: <GlobalOutlined />, label: lang === 'zh' ? 'EN' : '中文', onClick: onToggleLang },
    { key: 'logout', icon: <LogoutOutlined />, label: t.signout, onClick: signOut },
  ];

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white text-[#2E3B4E]">{t.loading}</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-[#2E3B4E]">
        <p>{error}</p>
        <Button type="primary" onClick={loadDashboard}>
          {t.retry}
        </Button>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4658E1',
          colorPrimaryHover: '#2F44B5',
          colorPrimaryActive: '#2F44B5',
          colorTextLightSolid: '#FFFFFF',
          colorTextBase: '#2E3B4E',
          colorTextSecondary: '#7E8C9D',
          colorBorder: '#E5E9F0',
          colorBgBase: '#FFFFFF',
          colorFillSecondary: '#E8F0F8',
          borderRadius: 12,
        },
      }}
    >
      {notifyCtx}
      <div className="min-h-screen bg-white px-5 py-6 text-[#2E3B4E]">
        <div className="mx-auto max-w-[1280px]">
          <Card className={`mb-4 ${cardClass}`} styles={{ body: { padding: 14 } }}>
            <div className="flex items-center justify-between">
              <Title
                level={3}
                style={{
                  margin: 0,
                  background: 'linear-gradient(90deg,#ec4899,#a855f7)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Spectrum
              </Title>
              <Space size={16}>
                <Badge count={data?.notifications.length || 0} size="small">
                  <Button shape="circle" icon={<BellOutlined />} onClick={() => setNotifOpen(true)} />
                </Badge>
                <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                  <Button
                    shape="round"
                    icon={
                      <Avatar
                        size={22}
                        src={data?.me?.photos?.[0] || data?.me?.profile_photo_url || undefined}
                        icon={<UserOutlined />}
                      />
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      {data?.me?.nickname || t.account}
                      <DownOutlined />
                    </span>
                  </Button>
                </Dropdown>
              </Space>
            </div>
          </Card>

          <Card className={`mb-4 ${cardClass}`} styles={{ body: { padding: 16 } }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Text style={{ color: '#2E3B4E' }}>
                {data?.quota && t.quota(data.quota.remaining, formatDate(data.quota.start, lang), formatDate(data.quota.end, lang))}
              </Text>
              <Tooltip title={addMatchDisabled ? t.createMatchDisabled : ''}>
                <Button type="primary" icon={<PlusOutlined />} onClick={requestMatch} disabled={addMatchDisabled}>
                  {t.createMatch}
                </Button>
              </Tooltip>
            </div>
          </Card>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data?.matches.map((m) => (
              <Card
                key={m.id}
                hoverable
                onClick={() => setSelectedId(m.id)}
                className={`cursor-pointer ${subCardClass} ${selectedId === m.id ? 'ring-2 ring-[#6D8EA0]' : ''}`}
              >
                <Space align="start">
                  <Avatar src={m.otherUser.photos?.[0] || m.otherUser.profile_photo_url || undefined} icon={<UserOutlined />} size={42} />
                  <div>
                    <Text strong style={{ color: '#2E3B4E' }}>
                      {m.otherUser.nickname}
                    </Text>
                    <div>
                      <Text type="secondary" style={{ color: '#7E8C9D' }}>
                        {m.current_day}/5 {t.periodDay}
                      </Text>
                    </div>
                    <Tag color="blue" style={{ marginTop: 6 }}>
                      {sourceLabel(m.match_source, lang)}
                    </Tag>
                    {m.isInTrialPeriod && <Tag color="gold">{t.trial}</Tag>}
                  </div>
                </Space>
              </Card>
            ))}
            {(data?.matches.length || 0) === 0 && (
              <Card className={cardClass} style={{ gridColumn: '1 / -1' }}>
                <Empty
                  description={
                    <Space direction="vertical" size={4}>
                      <Text style={{ color: '#2E3B4E' }}>{t.noMatches}</Text>
                      <Text type="secondary">{t.noMatchesHint}</Text>
                    </Space>
                  }
                >
                  <Button type="primary" icon={<PlusOutlined />} onClick={requestMatch} disabled={addMatchDisabled}>
                    {t.createMatch}
                  </Button>
                </Empty>
              </Card>
            )}
          </div>

          {selectedMatch && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card className={cardClass} title={selectedMatch.otherUser.nickname}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <Text style={{ color: '#2E3B4E' }}>{t.phase}</Text>
                    <div>
                      <Text style={{ color: '#7E8C9D' }}>
                        Day {selectedMatch.current_day} / Total 5 {t.periodDay}
                      </Text>
                    </div>
                  </div>
                  <Progress
                    percent={Math.min(100, Math.round((selectedMatch.current_day / 5) * 100))}
                    showInfo={false}
                    trailColor="#E0E7ED"
                    strokeColor={{ '0%': '#6D8EA0', '100%': '#8AA9B8' }}
                    style={{ width: 200 }}
                  />
                </div>

                <Card size="small" className={`mb-4 ${subCardClass}`}>
                  <Text strong style={{ color: '#2E3B4E' }}>
                    {t.clues}
                  </Text>
                  <div className="mt-3">
                    <Collapse
                      ghost
                      defaultActiveKey={['day1']}
                      items={dayPacks.map((clues, idx) => ({
                        key: `day${idx + 1}`,
                        label: `Day ${idx + 1}`,
                        children:
                          idx + 1 <= selectedMatch.current_day ? (
                            <Space direction="vertical" style={{ width: '100%' }}>
                              {clues.length === 0 ? (
                                <Text type="secondary">
                                  {t.waitingUnlock(
                                    idx + 1,
                                    formatDate(getUnlockTimeForDay(selectedMatch.next_unlock_at, selectedMatch.current_day, idx + 1), lang)
                                  )}
                                </Text>
                              ) : (
                                clues.map((clue, cidx) => (
                                  <Card key={`${idx}-${cidx}`} size="small" className={subCardClass}>
                                    <Text style={{ color: '#2E3B4E' }}>{clue}</Text>
                                  </Card>
                                ))
                              )}
                            </Space>
                          ) : (
                            <Text type="secondary">
                              {t.waitingUnlock(
                                idx + 1,
                                formatDate(getUnlockTimeForDay(selectedMatch.next_unlock_at, selectedMatch.current_day, idx + 1), lang)
                              )}
                            </Text>
                          ),
                      }))}
                    />
                  </div>
                </Card>

                <Card size="small" className={subCardClass}>
                  <Text strong style={{ color: '#2E3B4E' }}>
                    {lang === 'zh' ? '照片墙' : 'Photo Wall'}
                  </Text>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Image.PreviewGroup items={unlockedPhotos}>
                      {selectedPhotos.map((photo, index) => {
                        const locked = index >= unlockedCount;
                        const daysLeft = index - selectedMatch.current_day + 1;
                        return (
                          <div
                            key={`${photo}-${index}`}
                            className="relative h-[60px] w-[60px] overflow-hidden rounded-[12px] border border-[#E5E9F0] md:h-[80px] md:w-[80px]"
                            title={locked ? (lang === 'zh' ? `还需 ${daysLeft} 天解锁` : `Unlocks in ${daysLeft} day(s)`) : ''}
                          >
                            {locked ? (
                              <>
                                <img
                                  src={photo}
                                  alt={`locked-photo-${index + 1}`}
                                  className="h-full w-full object-cover"
                                  style={{ filter: 'blur(4px) grayscale(0.5)' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">🔒</div>
                              </>
                            ) : (
                              <Image
                                src={photo}
                                alt={`photo-${index + 1}`}
                                preview={{ mask: lang === 'zh' ? '预览' : 'Preview' }}
                                className="!h-full !w-full"
                                style={{ objectFit: 'cover' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </Image.PreviewGroup>
                  </div>
                </Card>
              </Card>

              <Card className={cardClass}>
                <div className="relative pb-16">
                  <Title level={5} style={{ color: '#2E3B4E' }}>
                    {t.messageTitle}
                  </Title>
                  <Text type="secondary">{t.messageRemain(hasSentToday ? 0 : 1)}</Text>
                  {hasSentToday && (
                    <div>
                      <Tag color="gold" style={{ marginTop: 8 }}>
                        {t.messageSentToday}
                      </Tag>
                    </div>
                  )}
                  <Input.TextArea
                    rows={3}
                    value={messageText}
                    maxLength={200}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t.messagePlaceholder}
                    disabled={hasSentToday || submitting}
                    style={{ marginTop: 10, marginBottom: 10 }}
                  />
                  <div className="mb-4 flex justify-end">
                    <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} disabled={hasSentToday || submitting || !messageText.trim()}>
                      {t.send}
                    </Button>
                  </div>
                  <List
                    size="small"
                    dataSource={messages}
                    locale={{ emptyText: t.noMessages }}
                    renderItem={(m) => (
                      <List.Item style={{ justifyContent: m.sender_id === myUserId ? 'flex-end' : 'flex-start' }}>
                        <Card size="small" className={`max-w-[85%] border-[#E5E9F0] ${m.sender_id === myUserId ? 'bg-[#E8F0F8]' : 'bg-white'}`}>
                          <Text style={{ color: '#2E3B4E' }}>{m.content}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {formatDate(m.created_at, lang)}
                            </Text>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                  <Button
                    icon={<StopOutlined />}
                    onClick={terminateMatch}
                    disabled={submitting}
                    className="absolute bottom-4 right-4 !border-0 !bg-[#C45B5B] !text-white hover:!bg-[#A33D3D] hover:!text-white"
                    style={{ boxShadow: '0 8px 18px rgba(163,61,61,0.22)' }}
                  >
                    {t.endJourney}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        <Drawer
          title={t.notifTitle}
          placement="right"
          open={notifOpen}
          width={420}
          onClose={() => setNotifOpen(false)}
          styles={{ body: { background: '#FFFFFF' }, header: { background: '#FFFFFF', color: '#2E3B4E' } }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {(data?.notifications.length || 0) === 0 && <Empty description={t.inviteEmpty} image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            {(data?.notifications || []).map((n) => (
              <Card key={n.id} className={subCardClass}>
                <div className="mb-2 flex items-center justify-between">
                  <Space>
                    <Avatar src={n.fromUser.profile_photo_url || undefined} icon={<UserOutlined />} />
                    <div>
                      <Text strong style={{ color: '#2E3B4E' }}>
                        {n.fromUser.nickname}
                      </Text>
                      <div>
                        <Text type="secondary">{formatDate(n.created_at, lang)}</Text>
                      </div>
                    </div>
                  </Space>
                  <Space direction="vertical" size={0} align="end">
                    <Text type="secondary">{formatDate(n.expires_at, lang)}</Text>
                    <Text type="secondary">{getExpireText(n.expires_at, lang)}</Text>
                  </Space>
                </div>
                <Space>
                  <Button type="primary" icon={<CheckOutlined />} onClick={() => respondInvite(n.id, true)} disabled={submitting}>
                    {t.agree}
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={() => respondInvite(n.id, false)} disabled={submitting}>
                    {t.ignore}
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
