import { Instagram, Youtube, Linkedin } from "lucide-react";

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/wezume_app", label: "Wezume on Instagram", Icon: Instagram },
  { href: "https://www.youtube.com/@Wezume", label: "Wezume on YouTube", Icon: Youtube },
  { href: "https://in.linkedin.com/company/wezume", label: "Wezume on LinkedIn", Icon: Linkedin },
];

export default function Footer() {
  return (
    <footer className="w-full bg-blue-800 text-white py-6">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p className="text-sm md:text-base">
            © {new Date().getFullYear()} Wezume. All rights reserved.
          </p>
          <p className="text-xs md:text-sm text-blue-200 mt-0.5">Bangalore, India</p>
        </div>

        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-11 h-11 flex items-center justify-center text-white hover:text-blue-200 hover:scale-110 transition-all"
            >
              <Icon size={22} />
            </a>
          ))}
        </div>

        <a
          href="/privacy-policy"
          className="text-sm md:text-base underline hover:text-blue-200 transition"
        >
          Privacy Policy
        </a>
      </div>
    </footer>
  );
}
