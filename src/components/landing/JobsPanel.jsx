import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X, Lock, Trash2 } from "lucide-react";

const ADMIN_EMAIL = "pitch@wezume.com";
const API_URL = import.meta.env.VITE_API_URL;

// Deliberately NOT the shared axiosInstance: that instance reads the
// visitor's own login cookie and redirects the whole page to /login on a
// 401. This widget's admin session is separate from the site's normal
// login and must never touch that cookie or trigger that redirect.
const jobsApi = axios.create({ baseURL: API_URL });

function initials(str) {
  return String(str)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const EMPTY_FORM = { name: "", company: "", exp: "", ctc: "", jobId: "" };

export default function JobsPanel() {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  const [editUnlocked, setEditUnlocked] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [newJob, setNewJob] = useState(EMPTY_FORM);
  const [applyRole, setApplyRole] = useState(null);

  const wrapRef = useRef(null);

  useEffect(() => {
    if (open && !hasFetched) {
      jobsApi
        .get("/jobs")
        .then((res) => setJobs(res.data))
        .catch(() => setJobs([]))
        .finally(() => setHasFetched(true));
    }
  }, [open, hasFetched]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      setOpen(false);
      setApplyRole(null);
      setShowPasswordPrompt(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function refreshJobs() {
    return jobsApi
      .get("/jobs")
      .then((res) => setJobs(res.data))
      .catch(() => {});
  }

  function submitPassword(e) {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordError("");
    jobsApi
      .post("/login", { email: ADMIN_EMAIL, password: passwordInput })
      .then((res) => {
        setAdminToken(res.data.token);
        setEditUnlocked(true);
        setShowPasswordPrompt(false);
        setPasswordInput("");
      })
      .catch(() => setPasswordError("Incorrect password."))
      .finally(() => setPasswordSubmitting(false));
  }

  function authHeaders() {
    return { headers: { Authorization: `Bearer ${adminToken}` } };
  }

  function updateField(id, field, value) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, [field]: value } : j)));
    jobsApi.put(`/jobs/edit/${id}`, { field, value }, authHeaders()).catch(refreshJobs);
  }

  function removeJob(id) {
    jobsApi.delete(`/jobs/delete/${id}`, authHeaders()).then(refreshJobs).catch(refreshJobs);
  }

  function addJob(e) {
    e.preventDefault();
    if (!newJob.name.trim()) return;
    jobsApi
      .post("/jobs/add", newJob, authHeaders())
      .then(() => {
        setNewJob(EMPTY_FORM);
        refreshJobs();
      })
      .catch(refreshJobs);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="relative border border-white text-white px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
      >
        Jobs
        <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[7px] md:text-[8px] font-extrabold tracking-wide px-1 py-0.5 md:px-1.5 rounded-full leading-none shadow">
          LIVE
        </span>
      </button>

      {/* Desktop dropdown */}
      {open && (
        <div className="hidden md:block absolute top-full right-0 mt-3 w-[420px] max-w-[calc(100vw-48px)] bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <PanelBody
            jobs={jobs}
            editUnlocked={editUnlocked}
            onEditToggle={() => (editUnlocked ? setEditUnlocked(false) : setShowPasswordPrompt(true))}
            onClose={() => setOpen(false)}
            onApply={setApplyRole}
            onFieldChange={updateField}
            onRemove={removeJob}
            newJob={newJob}
            setNewJob={setNewJob}
            onAddJob={addJob}
          />
        </div>
      )}

      {/* Mobile bottom sheet */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 max-h-[80vh] bg-white text-gray-900 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="w-9 h-1 rounded-full bg-gray-300 mx-auto mt-2.5 mb-1 flex-none" />
            <PanelBody
              jobs={jobs}
              editUnlocked={editUnlocked}
              onEditToggle={() => (editUnlocked ? setEditUnlocked(false) : setShowPasswordPrompt(true))}
              onClose={() => setOpen(false)}
              onApply={setApplyRole}
              onFieldChange={updateField}
              onRemove={removeJob}
              newJob={newJob}
              setNewJob={setNewJob}
              onAddJob={addJob}
              scrollable
            />
          </div>
        </div>
      )}

      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-5">
          <form
            onSubmit={submitPassword}
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
              disabled={passwordSubmitting}
              className="w-full bg-blue-600 text-white font-semibold text-sm rounded-lg py-2 hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {passwordSubmitting ? "Checking…" : "Unlock"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPasswordPrompt(false);
                setPasswordError("");
                setPasswordInput("");
              }}
              className="mt-2 text-xs text-gray-400 underline"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {applyRole && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-5">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-[280px] text-center">
            <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400" />
            <h4 className="font-semibold text-sm mb-1 text-gray-900">Continue in the app</h4>
            <p className="text-xs text-gray-500 mb-4">
              Applying happens in the Wezume app. Download it to apply to{" "}
              <b className="text-gray-700">{applyRole}</b>.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://play.google.com/store/apps/details?id=com.vprofile"
                className="bg-gray-900 text-white text-xs font-semibold rounded-lg py-2"
              >
                Get it on Google Play
              </a>
              <a
                href="https://apps.apple.com/in/app/wezume/id6740565222"
                className="bg-gray-900 text-white text-xs font-semibold rounded-lg py-2"
              >
                Download on the App Store
              </a>
            </div>
            <button
              type="button"
              onClick={() => setApplyRole(null)}
              className="mt-3 text-xs text-gray-400 underline"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelBody({
  jobs,
  editUnlocked,
  onEditToggle,
  onClose,
  onApply,
  onFieldChange,
  onRemove,
  newJob,
  setNewJob,
  onAddJob,
  scrollable,
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-200">
        <h3 className="font-semibold text-sm flex-1 min-w-0">Open roles</h3>
        <span className="text-xs text-gray-400 font-medium">
          {jobs.length} role{jobs.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={onEditToggle}
          aria-label="Edit list"
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            editUnlocked ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:text-gray-500"
          }`}
        >
          <Lock size={12} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"
        >
          <X size={13} />
        </button>
      </div>

      <div className={scrollable ? "overflow-y-auto flex-1" : "max-h-[340px] overflow-y-auto"}>
        {jobs.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-gray-400">No open roles right now.</div>
        )}
        {jobs.map((job) =>
          editUnlocked ? (
            <div key={job.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {initials(job.company)}
              </div>
              <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-0">
                <input
                  className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={job.name}
                  placeholder="Role"
                  onChange={(e) => onFieldChange(job.id, "name", e.target.value)}
                />
                <input
                  className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={job.company}
                  placeholder="Company"
                  onChange={(e) => onFieldChange(job.id, "company", e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={job.exp}
                  placeholder="Experience"
                  onChange={(e) => onFieldChange(job.id, "exp", e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={job.ctc}
                  placeholder="CTC"
                  onChange={(e) => onFieldChange(job.id, "ctc", e.target.value)}
                />
                <input
                  className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={job.jobId}
                  placeholder="Job ID"
                  onChange={(e) => onFieldChange(job.id, "jobId", e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(job.id)}
                title="Remove role"
                className="w-6 h-6 rounded-md border border-gray-200 bg-gray-50 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <div key={job.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {initials(job.company)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] text-gray-900 truncate">{job.name}</div>
                <div className="text-xs text-gray-500 truncate">{job.company}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  <b className="text-gray-500 font-semibold">{job.exp}</b> exp ·{" "}
                  <b className="text-gray-500 font-semibold">{job.ctc}</b> · {job.jobId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onApply(job.name)}
                className="flex-none bg-blue-600 text-white text-xs font-bold rounded-full px-3.5 py-1.5 hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          )
        )}
        {editUnlocked && (
          <form onSubmit={onAddJob} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <input
                className="col-span-2 border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newJob.name}
                placeholder="New role title"
                onChange={(e) => setNewJob((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="col-span-2 border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newJob.company}
                placeholder="Company"
                onChange={(e) => setNewJob((f) => ({ ...f, company: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newJob.exp}
                placeholder="Experience"
                onChange={(e) => setNewJob((f) => ({ ...f, exp: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newJob.ctc}
                placeholder="CTC"
                onChange={(e) => setNewJob((f) => ({ ...f, ctc: e.target.value }))}
              />
              <input
                className="col-span-2 border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newJob.jobId}
                placeholder="Job ID"
                onChange={(e) => setNewJob((f) => ({ ...f, jobId: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              className="w-full border-2 border-dashed border-gray-300 text-gray-500 text-xs font-semibold rounded-lg py-2 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add a role
            </button>
          </form>
        )}
      </div>
    </>
  );
}
