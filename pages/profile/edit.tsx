import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { supabase } from '@/lib/supabase';
import AppPageLoader from '@/components/AppPageLoader';

const { Title, Text } = Typography;

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      const { data: sessionResp } = await supabase.auth.getSession();
      if (!sessionResp.session?.user?.id) {
        router.replace('/auth/signin');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('nickname,username')
        .eq('id', sessionResp.session.user.id)
        .single();

      setNickname(data?.nickname || data?.username || '');
      setLoading(false);
    };

    bootstrap();
  }, [router]);

  const onSave = async () => {
    try {
      setSaving(true);
      const { data: sessionResp } = await supabase.auth.getSession();
      const uid = sessionResp.session?.user?.id;
      if (!uid) {
        router.replace('/auth/signin');
        return;
      }

      const nextName = nickname.trim();
      if (!nextName) {
        message.error('Nickname is required');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nextName })
        .eq('id', uid);

      if (error) throw error;
      message.success('Saved');
      router.push('/');
    } catch {
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AppPageLoader />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <Card>
          <Title level={3} style={{ marginTop: 0 }}>Update Profile</Title>
          <Text type="secondary">Temporary rebuilt page. We can replace with your exact previous version after diff replay.</Text>
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="Nickname" required>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} />
            </Form.Item>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/')}>Back</Button>
              <Button type="primary" loading={saving} onClick={onSave}>Save</Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
