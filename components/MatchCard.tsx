// components/MatchCard.tsx
// 单个匹配卡片，用于仪表盘列表

import React from 'react';
import Image from 'next/image';
import { Clock, Lock, Eye } from 'lucide-react';
import { MatchCard as MatchCardType } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface MatchCardProps {
  match: MatchCardType;
  onClick?: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const { t } = useTranslation();
  const isRevealed = match.current_day >= 5;
  const blurAmount = Math.max(0, 50 - match.current_day * 10);

  // 收集已解锁线索数量（用于展示进度）
  const unlockedCluesCount = [
    ...(match.day1_clues || []),
    ...(match.day2_clues || []),
    ...(match.day3_clues || []),
    ...(match.day4_clues || []),
  ].slice(0, match.current_day * 3).length;

  return (
    <div
      onClick={onClick}
      className="relative group bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-pink-500/50 transition-all hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]"
    >
      {/* 背景图片（带模糊效果） */}
      <div className="relative h-48 w-full">
        <Image
          src={match.otherUser.profile_photo_url || '/images/default-avatar.png'}
          alt={match.otherUser.username || 'Match'}
          fill
          className="object-cover transition-all duration-700"
          style={{ filter: isRevealed ? 'none' : `blur(${blurAmount}px) grayscale(0.5)` }}
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">
            {isRevealed ? match.otherUser.username : `Match #${match.id.slice(0, 4)}`}
          </h3>
          <div className="flex items-center gap-1 text-xs bg-black/60 px-2 py-1 rounded-full">
            <Clock size={12} className="text-pink-400" />
            <span>{t.dashboard.revealDay} {match.current_day}/5</span>
          </div>
        </div>

        {/* 线索进度条 */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>{t.dashboard.clueTitle}</span>
            <span>{unlockedCluesCount}/12</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
              style={{ width: `${(unlockedCluesCount / 12) * 100}%` }}
            />
          </div>
        </div>

        {/* 底部小标签 */}
        <div className="mt-3 flex items-center justify-between text-xs text-white/40">
          <span>MBTI: {match.otherUser.mbti || '???'}</span>
          {isRevealed ? (
            <span className="flex items-center gap-1 text-pink-400">
              <Eye size={12} /> {t.dashboard.unlocked}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Lock size={12} /> {t.dashboard.locked}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}