import { useEffect, useState } from "react";
import { useSiteStore } from "@/managers/stores/useSiteStore";
import { SiteDisclaimerScreen } from "@/components/site/SiteDisclaimerScreen";
import { SiteWelcomeScreen } from "@/components/site/SiteWelcomeScreen";
import { SiteSituationScreen } from "@/components/site/SiteSituationScreen";
import { SiteNamingScreen } from "@/components/site/SiteNamingScreen";
import { SiteTransitionOverlay } from "@/components/site/SiteTransitionOverlay";
import { SiteMobileBlocker } from "@/components/site/SiteMobileBlocker";
import { SiteLayout } from "@/components/site/SiteLayout";

/**
 * Check if user is on mobile device
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = (): void => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        "android",
        "webos",
        "iphone",
        "ipad",
        "ipod",
        "blackberry",
        "windows phone",
      ];
      const isMobileDevice = mobileKeywords.some((keyword) =>
        userAgent.includes(keyword),
      );
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function SitePage(): React.JSX.Element {
  const currentStep = useSiteStore((state) => state.currentStep);
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SiteMobileBlocker />;
  }

  if (currentStep === "disclaimer") {
    return <SiteDisclaimerScreen />;
  }

  return (
    <SiteLayout>
      {currentStep === "welcome" && <SiteWelcomeScreen />}
      {currentStep === "situation" && <SiteSituationScreen />}
      {currentStep === "naming" && <SiteNamingScreen />}
      {currentStep === "transition" && <SiteTransitionOverlay />}
    </SiteLayout>
  );
}
