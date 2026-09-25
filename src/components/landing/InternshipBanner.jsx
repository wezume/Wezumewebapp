import { useState } from "react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.vprofile";
const APP_STORE_URL = "https://apps.apple.com/in/app/wezume/id6740565222";
const JOB_ID = "J122";

function storeUrlForDevice() {
  if (typeof navigator === "undefined") return PLAY_STORE_URL;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return APP_STORE_URL;
  return PLAY_STORE_URL;
}

export default function InternshipBanner({ dismissed, onDismiss }) {
  const [showPopup, setShowPopup] = useState(false);

  function handleOk() {
    window.open(storeUrlForDevice(), "_blank", "noopener,noreferrer");
    setShowPopup(false);
  }

  return (
    <>
      {!dismissed && (
        <div className="w-full h-9 md:h-10 bg-gradient-to-r from-amber-400 to-orange-400">
          <div className="relative max-w-6xl mx-auto h-full px-10 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              aria-label="Apply for internship"
              className="ib-blink font-extrabold text-blue-950 text-xs sm:text-sm md:text-base flex items-center gap-1.5 tracking-wide"
            >
              🎓 Apply for Internship
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="absolute right-2 md:right-4 w-6 h-6 rounded-full bg-blue-950/20 text-blue-950 text-xs flex items-center justify-center hover:bg-blue-950/30"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showPopup && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-5"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[300px] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-2">🎬</div>
            <h4 className="font-bold text-base text-gray-900 mb-2">Apply for Internship</h4>
            <p className="text-sm text-gray-600 mb-5">
              Record your 1-min video resume in the app to apply — <b>Job ID: {JOB_ID}</b>
            </p>
            <button
              type="button"
              onClick={handleOk}
              className="w-full bg-blue-600 text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes ib-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .ib-blink {
          animation: ib-pulse 1.3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ib-blink {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
