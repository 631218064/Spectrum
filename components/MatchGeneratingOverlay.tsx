import React from 'react';

type Lang = 'zh' | 'en';

export default function MatchGeneratingOverlay({ lang }: { lang: Lang }) {
  const copy =
    lang === 'zh'
      ? {
          title: 'AI正在书写你们的故事',
          subtitle: '从星座、兴趣到微小习惯，每一处细节都将成为线索。',
          hint: '这大概需要几分钟',
        }
      : {
          title: 'AI is writing your story',
          subtitle: 'From zodiac and hobbies to tiny habits, every detail becomes a clue.',
          hint: 'This may take a few minutes',
        };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[radial-gradient(circle_at_center,#FFFFFF_0%,#F5F8FA_68%,#EEF3F8_100%)]">
      <div className="flex w-[92vw] max-w-[760px] flex-col items-center text-center">
        <h2 className="fade-in-1 text-[48px] font-semibold tracking-tight text-[#2E3B4E] md:text-[56px]">{copy.title}</h2>
        <p className="fade-in-2 mt-4 text-[18px] text-[#6B7688] md:text-[20px]">{copy.subtitle}</p>

        <div className="relative mt-16 h-[300px] w-[300px]">
          <svg className="absolute inset-0" viewBox="0 0 300 300" fill="none">
            <path
              d="M58 150C58 95 126 95 150 150C174 205 242 205 242 150C242 95 174 95 150 150C126 205 58 205 58 150"
              stroke="#4658E1"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="infinity-stroke"
            />
          </svg>
          <div className="floating-dot dot-1" />
          <div className="floating-dot dot-2" />
          <div className="floating-dot dot-3" />
          <div className="floating-dot dot-4" />
          <div className="floating-dot dot-5" />
          <div className="floating-dot dot-6" />
        </div>

        <div className="mt-20 h-12 w-12 rounded-full border-[1px] border-[#4658E1]/30 border-t-[#4658E1] spin-ring" />
        <p className="fade-in-3 mt-6 text-[12px] text-[#B5C0CC]">{copy.hint}</p>
      </div>

      <style jsx>{`
        .infinity-stroke {
          stroke-dasharray: 920;
          stroke-dashoffset: 920;
          opacity: 0.85;
          animation: drawInfinity 2.2s ease-in-out infinite;
        }
        .spin-ring {
          animation: spin 2.8s linear infinite;
        }
        .floating-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #a8d5e5;
          opacity: 0.35;
          animation: floatPulse 3.4s ease-in-out infinite;
        }
        .dot-1 {
          left: 22px;
          top: 138px;
          animation-delay: 0s;
        }
        .dot-2 {
          left: 104px;
          top: 54px;
          animation-delay: 0.35s;
        }
        .dot-3 {
          right: 78px;
          top: 84px;
          animation-delay: 0.7s;
        }
        .dot-4 {
          right: 20px;
          top: 150px;
          animation-delay: 1.05s;
        }
        .dot-5 {
          left: 114px;
          bottom: 40px;
          animation-delay: 1.4s;
        }
        .dot-6 {
          right: 122px;
          bottom: 26px;
          animation-delay: 1.75s;
        }
        .fade-in-1 {
          animation: fadeIn 0.45s ease-out both;
        }
        .fade-in-2 {
          animation: fadeIn 0.7s ease-out both;
        }
        .fade-in-3 {
          animation: fadeIn 1s ease-out both;
        }
        @keyframes drawInfinity {
          0% {
            stroke-dashoffset: 920;
            opacity: 0.6;
          }
          62% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.82;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes floatPulse {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 0.28;
          }
          50% {
            transform: translateY(-9px) scale(1.18);
            opacity: 0.78;
          }
          100% {
            transform: translateY(0px) scale(1);
            opacity: 0.28;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}
