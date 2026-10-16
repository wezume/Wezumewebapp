import { useEffect, useState } from "react";
import { Lock, Trash2 } from "lucide-react";
import { trustApi, useAdminAuth } from "../../context/AdminAuthContext";
import ImageUploadField from "./ImageUploadField";

const EMPTY_FORM = { title: "", subtitle: "", loc: "", photoUrl: "", alt: "" };

export default function WorkshopsRow() {
  const { isUnlocked, requestUnlock, lock, authHeaders } = useAdminAuth();

  const [workshops, setWorkshops] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [newWorkshop, setNewWorkshop] = useState(EMPTY_FORM);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    return trustApi
      .get("/workshops")
      .then((res) => setWorkshops(res.data))
      .catch(() => {});
  }

  function updateField(id, field, value) {
    setWorkshops((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
    trustApi.put(`/workshops/edit/${id}`, { field, value }, authHeaders()).catch(refresh);
  }

  function removeWorkshop(id) {
    trustApi.delete(`/workshops/delete/${id}`, authHeaders()).then(refresh).catch(refresh);
  }

  function addWorkshop(e) {
    e.preventDefault();
    if (!newWorkshop.title.trim() || !newWorkshop.photoUrl) return;
    const payload = { ...newWorkshop, alt: newWorkshop.alt || newWorkshop.title };
    trustApi
      .post("/workshops/add", payload, authHeaders())
      .then(() => {
        setNewWorkshop(EMPTY_FORM);
        refresh();
      })
      .catch(refresh);
  }

  const duplicatedWorkshops = [...workshops, ...workshops];

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
          Behind the Scenes
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Inside Our Workshops</h2>
      </div>

      {isUnlocked ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {workshops.map((card) => (
              <div key={card.id} className="w-56 bg-white border border-gray-200 rounded-2xl p-3 flex flex-col gap-1.5">
                <ImageUploadField
                  value={card.photoUrl}
                  onUploaded={(url) => updateField(card.id, "photoUrl", url)}
                  label="photo"
                />
                <input
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={card.title}
                  placeholder="Title"
                  onChange={(e) => updateField(card.id, "title", e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={card.subtitle}
                  placeholder="Subtitle"
                  onChange={(e) => updateField(card.id, "subtitle", e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
                  value={card.loc}
                  placeholder="Location"
                  onChange={(e) => updateField(card.id, "loc", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeWorkshop(card.id)}
                  className="self-end w-6 h-6 rounded-md border border-gray-200 bg-gray-50 text-red-500 flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            <form onSubmit={addWorkshop} className="w-56 border-2 border-dashed border-gray-300 rounded-2xl p-3 flex flex-col gap-1.5">
              <ImageUploadField
                value={newWorkshop.photoUrl}
                onUploaded={(url) => setNewWorkshop((f) => ({ ...f, photoUrl: url }))}
                label="photo"
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newWorkshop.title}
                placeholder="Title"
                onChange={(e) => setNewWorkshop((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newWorkshop.subtitle}
                placeholder="Subtitle"
                onChange={(e) => setNewWorkshop((f) => ({ ...f, subtitle: e.target.value }))}
              />
              <input
                className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
                value={newWorkshop.loc}
                placeholder="Location"
                onChange={(e) => setNewWorkshop((f) => ({ ...f, loc: e.target.value }))}
              />
              <button
                type="submit"
                className="border-2 border-dashed border-gray-300 text-gray-500 text-xs font-semibold rounded-lg py-1.5 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add workshop
              </button>
            </form>
          </div>
        </div>
      ) : (
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
                    src={card.photoUrl}
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
      )}

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
