import { useState } from "react";

const ASSET_DIR = "/assets/homepage-trust-sections";

const colleges = [
  { name: "Krea University", logo: "krea-university.png" },
  { name: "REVA University", logo: "reva-university.png" },
  { name: "Madras Christian College", label: "MCC Boyd", logo: "madras-christian-college.png", wide: true },
  { name: "M.O.P Vaishnav College for Women", label: "MOP Vaishnav", logo: "m-o-p-vaishnav-college-for-women.png", wide: true },
  { name: "Jansons School of Business", logo: "jansons-school-of-business.png" },
  { name: "Saveetha Institute of Medical and Technical Sciences", logo: "saveetha-institute-of-medical-and-technical-sciences.png" },
  { name: "DBS Global University", logo: "dbs-global-university.png" },
];
// two identical, self-contained groups (logos + trailing counter tile) so
// translateX(-50%) wraps seamlessly regardless of how wide the counter tile is
const collegeGroups = [colleges, colleges];

const companies = [
  { name: "Wipro", logo: "wipro.png" },
  { name: "Larsen & Toubro", logo: "larsen-and-toubro.png" },
  { name: "L&T-SuFin", logo: "l-and-t-sufin.svg" },
  { name: "SurveySparrow", logo: "surveysparrow.png" },
  { name: "MUFG", logo: "mufg.png" },
  { name: "Itus Capital", logo: "itus-capital.png" },
  { name: "Mesa School of Business", logo: "mesa-school-of-business.png" },
  { name: "Infosys", logo: "infosys.png" },
  { name: "TCS", logo: "tata-consultancy-services.png" },
  { name: "HCLTech", logo: "hcltech.png" },
  { name: "Deloitte", logo: "deloitte.png" },
  { name: "Accenture", logo: "accenture.png" },
  { name: "Cognizant", logo: "cognizant.png" },
  { name: "Amazon", logo: "amazon.png" },
  { name: "Goldman Sachs", logo: "goldman-sachs.png" },
  { name: "HDFC Bank", logo: "hdfc-bank.png" },
  { name: "ICICI Bank", logo: "icici-bank.png" },
];
const companyGroups = [companies, companies];

const stats = [
  { value: "50+", label: "partner institutes" },
  { value: "8+", label: "cities" },
  { value: "10K+", label: "students trained" },
  { value: "250+", label: "networked companies" },
];

const BAND = {
  college: "border-t-emerald-400",
  company: "border-t-blue-400",
};

function LogoTile({ name, label, logo, wide, decorative, kind }) {
  return (
    <div
      className={`flex-none ${wide ? "w-64" : "w-48"} h-24 bg-white border border-gray-200 border-t-4 ${BAND[kind]} rounded-xl flex items-center justify-center gap-3 px-4`}
    >
      <img
        src={`${ASSET_DIR}/${logo}`}
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

export default function InstitutesRow() {
  const [collegesPaused, setCollegesPaused] = useState(false);
  const [companiesPaused, setCompaniesPaused] = useState(false);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 mb-6">
        <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
          Our Network
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Institutes Partnered With
        </h2>
        <p className="text-gray-500">Colleges training talent, Companies hiring it.</p>
      </div>

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
