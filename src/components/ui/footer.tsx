import { Link } from "react-router-dom";

interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface FooterProps {
  logoTitle?: string;
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

const Footer = ({
  logoTitle = "SYNTERA",
  tagline = "Speak. Persuade with Precision.",
  menuItems = [
    {
      title: "Product",
      links: [
        { text: "Scenarios", url: "/scenarios" },
        { text: "Progress", url: "/progress" },
        { text: "Badges", url: "/badges" },
        { text: "History", url: "/history" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Terms of Service", url: "/terms" },
        { text: "Privacy Policy", url: "/privacy" },
        { text: "Cookie Policy", url: "/cookies" },
      ],
    },
  ],
  copyright = "© 2026 Syntera. All rights reserved.",
  bottomLinks = [
    { text: "Terms", url: "/terms" },
    { text: "Privacy", url: "/privacy" },
    { text: "Cookies", url: "/cookies" },
  ],
}: FooterProps) => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col md:flex-row md:justify-between gap-10">
          <div className="max-w-xs">
            <span className="font-heading text-xl tracking-tight text-foreground">
              {logoTitle}
            </span>
            <p className="mt-3 text-xs font-mono text-muted-foreground">
              {tagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            {menuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h4 className="font-mono text-xs uppercase tracking-widest text-foreground mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link
                        to={link.url}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[10px] text-muted-foreground">
            {copyright}
          </p>
          <div className="flex gap-4">
            {bottomLinks.map((link, linkIdx) => (
              <Link
                key={linkIdx}
                to={link.url}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
