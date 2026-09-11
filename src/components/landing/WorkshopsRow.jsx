import { useState } from "react";

const ASSET_DIR = "/assets/homepage-trust-sections";

const workshops = [
  { title: "Video Resume Workshop", subtitle: "MOP Vaishnav College", loc: "Chennai", photo: "video-resume-workshop-at-mop-vaishnav-college.jpg", alt: "Video resume workshop at MOP Vaishnav College" },
  { title: "Interactive Workshop", subtitle: "Saveetha", loc: "Chennai", photo: "workshop-at-saveetha.jpg", alt: "Workshop at Saveetha" },
  { title: "Interactive Workshop", subtitle: "Jansons", loc: "Coimbatore", photo: "workshop-at-jansons.jpg", alt: "Workshop at Jansons" },
  { title: "NHRD Event", subtitle: "500+ attendance", loc: "Bengaluru", photo: "nhrd-event.jpg", alt: "NHRD event" },
  { title: "Campus Workshop", subtitle: "Reva University", loc: "Bengaluru", photo: "workshop-at-reva-university.jpg", alt: "Workshop at Reva University" },
  { title: "Synergize '25", subtitle: "Conference keynote", loc: "Conference", photo: "synergize-25-conference.png", alt: "Synergize 25 conference" },
  { title: "Bridge '25", subtitle: "ICT Academy", loc: "Bengaluru", photo: "bridge-25-ict-academy.jpg", alt: "Bridge 25, ICT Academy" },
];

// duplicate for seamless infinite scroll
const duplicatedWorkshops = [...workshops, ...workshops];

export default function WorkshopsRow() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 mb-6">
        <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
          Behind the Scenes
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Inside Our Workshops</h2>
      </div>

      <div
        className="wr-mask overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className="flex gap-4 w-max wr-track"
          style={{ animationPlayState: isPaused ? "paused" : "running" }}
        >
          {duplicatedWorkshops.map((card, i) => (
            <div
              key={i}
              aria-hidden={i >= workshops.length ? "true" : undefined}
              className="flex-none w-56 bg-white border border-gray-200 rounded-2xl overflow-hidden"
            >
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <img
                  src={`${ASSET_DIR}/${card.photo}`}
                  alt={i >= workshops.length ? "" : card.alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute left-0 right-0 bottom-0 h-1/2"
                  style={{ background: "linear-gradient(to top, rgba(15,15,20,0.65), transparent)" }}
                />
                <div className="absolute left-2.5 bottom-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="text-white text-xs font-semibold">{card.loc}</span>
                </div>
              </div>
              <div className="p-3.5">
                <div className="font-semibold text-sm text-gray-900">{card.title}</div>
                <div className="text-xs text-gray-500">{card.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .wr-mask {
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
        }
        @keyframes wr-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wr-track {
          animation: wr-scroll 44s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .wr-track {
            animation: none !important;
          }
          .wr-mask {
            overflow-x: auto;
          }
        }
      `}</style>
    </section>
  );
}
