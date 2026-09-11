import { useState } from "react";

const placements = [
  { name: "Agnes Dominic", inst: "BBA, Krea University", role: "Strategy Associate", company: "PE-Backed Firm, Bangalore", initials: "AD" },
  { name: "Aarya Agarwal", inst: "BBA, Krea University", role: "Strategy Associate", company: "PE-Backed Firm, Bangalore", initials: "AA" },
  { name: "Navneeth Krishnan", inst: "MBA, Amrita Vishwa Vidyapeetham", role: "Brand Executive", company: "Wipro Consumer Care", initials: "NK" },
  { name: "Roshini P", inst: "MBA, Krea University", role: "HR Associate", company: "MUFG", initials: "RP" },
  { name: "Hamsini K", inst: "BBA, Krea University", role: "Customer Growth Specialist", company: "SurveySparrow", initials: "HK" },
  { name: "Sushruthan", inst: "MBA, Amrita Vishwa Vidyapeetham", role: "IT Global Sales Associate", company: "Multicoreware", initials: "S" },
];

// duplicate for seamless infinite scroll
const duplicatedPlacements = [...placements, ...placements];

export default function PlacementWall() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 mb-6">
        <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
          Success stories
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          50+ offers made, straight from the Wezume network
        </h2>
      </div>

      <div
        className="pw-mask overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className="flex gap-4 w-max pw-track"
          style={{ animationPlayState: isPaused ? "paused" : "running" }}
        >
          {duplicatedPlacements.map((card, i) => (
            <div
              key={i}
              aria-hidden={i >= placements.length ? "true" : undefined}
              className="flex-none w-64 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {card.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{card.name}</div>
                  <div className="text-xs text-gray-500 truncate">{card.inst}</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {card.role}
                </span>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {card.company}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .pw-mask {
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
        }
        @keyframes pw-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pw-track {
          animation: pw-scroll 38s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pw-track {
            animation: none !important;
          }
          .pw-mask {
            overflow-x: auto;
          }
        }
      `}</style>
    </section>
  );
}
