import { useEffect, useState } from "react";
import { Lock, Trash2 } from "lucide-react";
import { trustApi, useAdminAuth } from "../../context/AdminAuthContext";
import ImageUploadField from "./ImageUploadField";

const BAND = {
  college: "border-t-emerald-400",
  company: "border-t-blue-400",
};

const EMPTY_FORM = { name: "", label: "", logoUrl: "", wide: false };

function LogoTile({ name, label, logoUrl, wide, decorative, kind }) {
  return (
    <div
      className={`flex-none ${wide ? "w-64" : "w-48"} h-24 bg-white border border-gray-200 border-t-4 ${BAND[kind]} rounded-xl flex items-center justify-center gap-3 px-4`}
    >
      <img
        src={logoUrl}
        alt={decorative ? "" : name}
        loading="lazy"
        decoding="async"
        className={`max-h-14 ${wide ? "max-w-[100px]" : "max-w-[150px]"} object-contain`}
      />
      {label && (
        <div className="font-mono text-[10px] tracking-wide text-gray-500 text-center leading-tight">
          {label}
        </div>
      )}
    </div>
  );
}

function CounterTile({ label }) {
  return (
    <div className="flex-none w-48 h-24 bg-blue-100 rounded-xl flex items-center justify-center px-3">
      <div className="font-bold text-[13px] text-blue-700 text-center">{label}</div>
    </div>
  );
}

function RowLabel({ dot, children }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-4 sm:px-6 max-w-2xl mx-auto">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-xs font-semibold tracking-wide text-gray-600">{children}</span>
    </div>
  );
}

function EditGrid({ items, kind, onFieldChange, onRemove, newItem, setNewItem, onAdd, showLabelField }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-6">
      {items.map((item) => (
        <div key={item.id} className="w-48 bg-white border border-gray-200 rounded-xl p-2.5 flex flex-col gap-1.5">
          <ImageUploadField
            value={item.logoUrl}
            onUploaded={(url) => onFieldChange(item.id, "logoUrl", url)}
            label="logo"
          />
          <input
            className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
            value={item.name}
            placeholder="Name"
            onChange={(e) => onFieldChange(item.id, "name", e.target.value)}
          />
          {showLabelField && (
            <input
              className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-gray-50"
              value={item.label || ""}
              placeholder="Label (optional)"
              onChange={(e) => onFieldChange(item.id, "label", e.target.value)}
            />
          )}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="self-end w-6 h-6 rounded-md border border-gray-200 bg-gray-50 text-red-500 flex items-center justify-center"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <form onSubmit={onAdd} className="w-48 border-2 border-dashed border-gray-300 rounded-xl p-2.5 flex flex-col gap-1.5">
        <ImageUploadField
          value={newItem.logoUrl}
          onUploaded={(url) => setNewItem((f) => ({ ...f, logoUrl: url }))}
          label="logo"
        />
        <input
          className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
          value={newItem.name}
          placeholder="Name"
          onChange={(e) => setNewItem((f) => ({ ...f, name: e.target.value }))}
        />
        {showLabelField && (
          <input
            className="border border-dashed border-gray-300 rounded-md px-2 py-1 text-xs"
            value={newItem.label}
            placeholder="Label (optional)"
            onChange={(e) => setNewItem((f) => ({ ...f, label: e.target.value }))}
          />
        )}
        <button
          type="submit"
          className="border-2 border-dashed border-gray-300 text-gray-500 text-xs font-semibold rounded-lg py-1.5 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add {kind}
        </button>
      </form>
    </div>
  );
}

export default function InstitutesRow() {
  const { isUnlocked, requestUnlock, lock, authHeaders } = useAdminAuth();

  const [colleges, setColleges] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [collegesPaused, setCollegesPaused] = useState(false);
  const [companiesPaused, setCompaniesPaused] = useState(false);
  const [newCollege, setNewCollege] = useState(EMPTY_FORM);
  const [newCompany, setNewCompany] = useState(EMPTY_FORM);

  useEffect(() => {
    refreshColleges();
    refreshCompanies();
  }, []);

  function refreshColleges() {
    return trustApi
      .get("/partners?type=COLLEGE")
      .then((res) => setColleges(res.data))
      .catch(() => {});
  }

  function refreshCompanies() {
    return trustApi
      .get("/partners?type=COMPANY")
      .then((res) => setCompanies(res.data))
      .catch(() => {});
  }

  function updateField(setList, id, field, value) {
    setList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    trustApi.put(`/partners/edit/${id}`, { field, value }, authHeaders()).catch(() => {
      refreshColleges();
      refreshCompanies();
    });
  }

  function removeItem(id, refresh) {
    trustApi.delete(`/partners/delete/${id}`, authHeaders()).then(refresh).catch(refresh);
  }

  function addItem(type, newItem, setNewItem, refresh) {
    return (e) => {
      e.preventDefault();
      if (!newItem.name.trim() || !newItem.logoUrl) return;
      trustApi
        .post("/partners/add", { type, ...newItem }, authHeaders())
        .then(() => {
          setNewItem(EMPTY_FORM);
          refresh();
        })
        .catch(refresh);
    };
  }

  const collegeGroups = [colleges, colleges];
  const companyGroups = [companies, companies];

  const stats = [
    { value: "50+", label: "partner institutes" },
    { value: "8+", label: "cities" },
    { value: "10K+", label: "students trained" },
    { value: "250+", label: "networked companies" },
  ];

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
          Our Network
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Institutes Partnered With
        </h2>
        <p className="text-gray-500">Colleges training talent, Companies hiring it.</p>
      </div>

      {isUnlocked ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <RowLabel dot="bg-emerald-400">Colleges</RowLabel>
          <EditGrid
            items={colleges}
            kind="college"
            onFieldChange={(id, field, value) => updateField(setColleges, id, field, value)}
            onRemove={(id) => removeItem(id, refreshColleges)}
            newItem={newCollege}
            setNewItem={setNewCollege}
            onAdd={addItem("COLLEGE", newCollege, setNewCollege, refreshColleges)}
            showLabelField
          />

          <RowLabel dot="bg-blue-400">Companies</RowLabel>
          <EditGrid
            items={companies}
            kind="company"
            onFieldChange={(id, field, value) => updateField(setCompanies, id, field, value)}
            onRemove={(id) => removeItem(id, refreshCompanies)}
            newItem={newCompany}
            setNewItem={setNewCompany}
            onAdd={addItem("COMPANY", newCompany, setNewCompany, refreshCompanies)}
          />
        </div>
      ) : (
        <>
          {/* Colleges row: right -> left */}
          <RowLabel dot="bg-emerald-400">Colleges</RowLabel>
          <div
            className="ir-mask overflow-hidden mb-4"
            onMouseEnter={() => setCollegesPaused(true)}
            onMouseLeave={() => setCollegesPaused(false)}
            onTouchStart={() => setCollegesPaused(true)}
            onTouchEnd={() => setCollegesPaused(false)}
          >
            <div
              className="flex gap-4 w-max ir-track-colleges"
              style={{ animationPlayState: collegesPaused ? "paused" : "running" }}
            >
              {collegeGroups.map((group, g) => (
                <div key={g} aria-hidden={g > 0 ? "true" : undefined} className="flex gap-4 flex-none">
                  {group.map((c, i) => (
                    <LogoTile key={i} {...c} kind="college" decorative={g > 0} />
                  ))}
                  <CounterTile label="+42 more colleges" />
                </div>
              ))}
            </div>
          </div>

          {/* Companies row: left -> right */}
          <RowLabel dot="bg-blue-400">Companies</RowLabel>
          <div
            className="ir-mask overflow-hidden"
            onMouseEnter={() => setCompaniesPaused(true)}
            onMouseLeave={() => setCompaniesPaused(false)}
            onTouchStart={() => setCompaniesPaused(true)}
            onTouchEnd={() => setCompaniesPaused(false)}
          >
            <div
              className="flex gap-4 w-max ir-track-companies"
              style={{ animationPlayState: companiesPaused ? "paused" : "running" }}
            >
              {companyGroups.map((group, g) => (
                <div key={g} aria-hidden={g > 0 ? "true" : undefined} className="flex gap-4 flex-none">
                  {group.map((c, i) => (
                    <LogoTile key={i} {...c} kind="company" decorative={g > 0} />
                  ))}
                  <CounterTile label="+233 more companies" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 max-w-3xl mx-auto mt-6 pt-5 border-t border-gray-200 px-4 sm:px-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-xl font-bold text-blue-600">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .ir-mask {
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%);
        }
        @keyframes ir-scroll-rtl {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes ir-scroll-ltr {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ir-track-colleges {
          animation: ir-scroll-rtl 34s linear infinite;
        }
        .ir-track-companies {
          animation: ir-scroll-ltr 40s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ir-track-colleges,
          .ir-track-companies {
            animation: none !important;
          }
          .ir-mask {
            overflow-x: auto;
          }
        }
      `}</style>
    </section>
  );
}
