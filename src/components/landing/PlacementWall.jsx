import { useEffect, useState } from "react";
import { Lock, Trash2 } from "lucide-react";
import { trustApi, useAdminAuth } from "../../context/AdminAuthContext";

const EMPTY_FORM = { name: "", inst: "", role: "", company: "", initials: "" };

export default function PlacementWall() {
  const { isUnlocked, requestUnlock, lock, authHeaders } = useAdminAuth();

  const [stories, setStories] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [newStory, setNewStory] = useState(EMPTY_FORM);

  useEffect(() => {
    trustApi
      .get("/success-stories")
      .then((res) => setStories(res.data))
      .catch(() => setStories([]));
  }, []);

  function refresh() {
    return trustApi
      .get("/success-stories")
      .then((res) => setStories(res.data))
      .catch(() => {});
  }

  function updateField(id, field, value) {
    setStories((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    trustApi.put(`/success-stories/edit/${id}`, { field, value }, authHeaders()).catch(refresh);
  }

  function removeStory(id) {
    trustApi.delete(`/success-stories/delete/${id}`, authHeaders()).then(refresh).catch(refresh);
  }

  function addStory(e) {
    e.preventDefault();
    if (!newStory.name.trim()) return;
    trustApi
      .post("/success-stories/add", newStory, authHeaders())
      .then(() => {
        setNewStory(EMPTY_FORM);
        refresh();
      })
      .catch(refresh);
  }

  const duplicatedStories = [...stories, ...stories];

  return (
    <section className="py-10 bg-white relative">
      <button
        type="button"
        onClick={() => (isUnlocked ? lock() : requestUnlock())}
        aria-label="Edit list"
        className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
          isUnlocked ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:text-gray-400"
        }`}
      >
        <Lock size={13} />
      </button>

      <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 mb-6">
        <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
          Success stories
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          50+ offers made, straight from the Wezume network
        </h2>
      </div>

      {isUnlocked ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {stories.map((card) => (
              <div
                key={card.id}
                className="w-64 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-start gap-2">
                  <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-0">
                    <input
                      className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                      value={card.name}
                      placeholder="Name"
                      onChange={(e) => updateField(card.id, "name", e.target.value)}
                    />
                    <input
                      className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                      value={card.inst}
                      placeholder="Institute"
                      onChange={(e) => updateField(card.id, "inst", e.target.value)}
                    />
                    <input
                      className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                      value={card.role}
                      placeholder="Role"
                      onChange={(e) => updateField(card.id, "role", e.target.value)}
                    />
                    <input
                      className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                      value={card.company}
                      placeholder="Company"
                      onChange={(e) => updateField(card.id, "company", e.target.value)}
                    />
                    <input
                      className="col-span-2 border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                      value={card.initials}
                      placeholder="Initials"
                      onChange={(e) => updateField(card.id, "initials", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStory(card.id)}
                    className="w-6 h-6 rounded-md border border-gray-200 bg-gray-50 text-red-500 flex items-center justify-center flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            <form
              onSubmit={addStory}
              className="w-64 border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col gap-1.5"
            >
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newStory.name}
                placeholder="Name"
                onChange={(e) => setNewStory((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newStory.inst}
                placeholder="Institute"
                onChange={(e) => setNewStory((f) => ({ ...f, inst: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newStory.role}
                placeholder="Role"
                onChange={(e) => setNewStory((f) => ({ ...f, role: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newStory.company}
                placeholder="Company"
                onChange={(e) => setNewStory((f) => ({ ...f, company: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newStory.initials}
                placeholder="Initials"
                onChange={(e) => setNewStory((f) => ({ ...f, initials: e.target.value }))}
              />
              <button
                type="submit"
                className="mt-1 border-2 border-dashed border-gray-300 text-gray-500 text-xs font-semibold rounded-lg py-2 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add success story
              </button>
            </form>
          </div>
        </div>
      ) : (
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
            {duplicatedStories.map((card, i) => (
              <div
                key={i}
                aria-hidden={i >= stories.length ? "true" : undefined}
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
      )}

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
