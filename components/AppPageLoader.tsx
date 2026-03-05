import React from 'react';

export default function AppPageLoader() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#F5F0E8_0%,#E8F0F8_100%)]">
      <div className="pointer-events-none absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="loader-particle absolute h-[4px] w-[4px] rounded-full bg-[#A8D5E5]"
            style={{
              left: `${8 + ((i * 11) % 84)}%`,
              top: `${10 + ((i * 17) % 78)}%`,
              animationDelay: `${(i % 6) * 0.4}s`,
              animationDuration: `${5.5 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative h-12 w-12">
          <div className="h-12 w-12 rounded-full border-2 border-[#4658E1]/20" />
          <div className="loader-orbit absolute inset-0">
            <span className="loader-dot absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4658E1]" />
          </div>
        </div>
        <p className="mt-4 text-sm text-[#7E8C9D]/60">Spectrum</p>
      </div>

      <style jsx>{`
        .loader-orbit {
          animation: spin 1s linear infinite;
          transform-origin: 50% 50%;
        }
        .loader-dot {
          box-shadow: 0 0 10px rgba(70, 88, 225, 0.35);
        }
        .loader-particle {
          opacity: 0.2;
          animation: floatY ease-in-out infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes floatY {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.14;
          }
          50% {
            transform: translateY(-8px);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
