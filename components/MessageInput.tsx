// components/MessageInput.tsx
// 每日消息输入框，带发送按钮和计数

import React, { useState } from 'react';
import Button from './Button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({ onSend, disabled = false, placeholder }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await onSend(content);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled || sending}
        placeholder={placeholder || "Write your daily message..."}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-pink-500 disabled:opacity-50"
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={disabled || !content.trim() || sending}
        loading={sending}
      >
        <Send size={18} />
      </Button>
    </form>
  );
}