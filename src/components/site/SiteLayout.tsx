import type { ReactNode } from "react";
import { SITE_CONFIG } from "@/data/site/siteConfig";
import { Subtitles } from "@/components/ui/Subtitles";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps): React.JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#87CEEB",
        backgroundImage: `url(${SITE_CONFIG.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {children}
      <Subtitles />
    </div>
  );
}
