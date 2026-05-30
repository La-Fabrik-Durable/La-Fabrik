import { SITE_CONFIG } from "@/data/site/siteConfig";

const MOBILE_TEXT =
  "Ce site a été conçu pour être utilisé sur ordinateur. Veuillez réessayer sur votre ordinateur pour une expérience optimale.";

/**
 * Mobile blocker screen
 */
export function SiteMobileBlocker(): React.JSX.Element {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#87CEEB",
        backgroundImage: `url(${SITE_CONFIG.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 48,
      }}
    >
      <img
        src="public/assets/logo/logo.jpg"
        alt="Logo"
        style={{
          width: 120,
          height: "auto",
        }}
      />
      <p
        style={{
          color: "#F2F2F2",
          textAlign: "center",
          textShadow: "0 4px 10px rgba(0, 0, 0, 0.4)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 18,
          fontWeight: 500,
          lineHeight: 1.6,
          maxWidth: 320,
          margin: 0,
        }}
      >
        {MOBILE_TEXT}
      </p>
    </div>
  );
}
