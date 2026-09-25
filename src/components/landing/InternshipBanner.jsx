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
        <div className="w-full flex justify-center py-2 md:py-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              aria-label="Apply for internship"
              className="ib-blink bg-blue-600 text-white font-extrabold text-sm sm:text-base md:text-lg px-5 py-2.5 md:px-6 md:py-3 rounded-full shadow-lg tracking-wide hover:bg-blue-700 transition-colors"
            >
              Apply for Internship
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] leading-none flex items-center justify-center shadow hover:bg-gray-900"
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
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.65); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
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
