import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { Lock } from "lucide-react";

const ADMIN_EMAIL = "pitch@wezume.com";
const API_URL = import.meta.env.VITE_API_URL;

// Deliberately NOT the shared axiosInstance: that instance reads the
// visitor's own login cookie and redirects the whole page to /login on a
// 401. Admin-editing sessions for the homepage trust sections are separate
// from the site's normal login and must never touch that cookie or trigger
// that redirect.
export const trustApi = axios.create({ baseURL: API_URL });

const AdminAuthContext = createContext(null);

// Shared across Jobs, Success Stories, Institutes Partnered With, and
// Workshops: unlocking once (via pitch@wezume.com's real login) unlocks
// inline editing everywhere in this session, instead of prompting for the
// password separately per section.
export function AdminAuthProvider({ children }) {
  const [adminToken, setAdminToken] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && showPrompt) closePrompt();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showPrompt]);

  function requestUnlock() {
    if (adminToken) return;
    setShowPrompt(true);
  }

  function lock() {
    setAdminToken(null);
  }

  function closePrompt() {
    setShowPrompt(false);
    setPasswordError("");
    setPasswordInput("");
  }

  function authHeaders() {
    return { headers: { Authorization: `Bearer ${adminToken}` } };
  }

  function submitPassword(e) {
    e.preventDefault();
    setSubmitting(true);
    setPasswordError("");
    trustApi
      .post("/login", { email: ADMIN_EMAIL, password: passwordInput })
      .then((res) => {
        setAdminToken(res.data.token);
        setShowPrompt(false);
        setPasswordInput("");
      })
      .catch(() => setPasswordError("Incorrect password."))
      .finally(() => setSubmitting(false));
  }

  return (
    <AdminAuthContext.Provider
      value={{ isUnlocked: !!adminToken, requestUnlock, lock, authHeaders }}
    >
      {children}

      {showPrompt && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-5"
          onClick={closePrompt}
        >
          <form
            onSubmit={submitPassword}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-[280px] text-center"
          >
            <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white">
              <Lock size={18} />
            </div>
            <h4 className="font-semibold text-sm mb-3 text-gray-900">Admin password</h4>
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
            />
            {passwordError && <div className="text-xs text-red-600 mb-2">{passwordError}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-semibold text-sm rounded-lg py-2 hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Checking…" : "Unlock"}
            </button>
            <button type="button" onClick={closePrompt} className="mt-2 text-xs text-gray-400 underline">
              Cancel
            </button>
          </form>
        </div>
      )}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
