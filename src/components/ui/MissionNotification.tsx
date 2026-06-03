import { MISSION_NOTIFICATION_IMAGE_PATHS } from "@/data/gameplay/missionNotifications";
import type { RepairMissionId } from "@/types/gameplay/repairMission";

// Reference aspect ratio of the original PNG mission notifications
// (589 × 211). Webm assets are square (2000 × 2000), so without this hint the
// <video> element renders at the wrong dimensions and shifts the layout.
const NOTIFICATION_ASPECT_RATIO = "589 / 211";

interface MissionNotificationProps {
  mission?: RepairMissionId;
  imagePath?: string;
  visible?: boolean;
}

export function MissionNotification({
  mission,
  imagePath,
  visible = true,
}: MissionNotificationProps): React.JSX.Element {
  const src =
    imagePath ?? (mission ? MISSION_NOTIFICATION_IMAGE_PATHS[mission] : "");
  const isVideo = src.toLowerCase().endsWith(".webm");

  return (
    <div
      className={`mission-notification${visible ? "" : " mission-notification--hidden"}`}
      aria-live="polite"
    >
      <div className="mission-notification__glow" />
      <span className="mission-notification__image-wrap">
        {isVideo ? (
          <video
            className="mission-notification__image"
            style={{
              aspectRatio: NOTIFICATION_ASPECT_RATIO,
              objectFit: "cover",
            }}
            src={src}
            aria-label="Nouvel objectif de mission"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        ) : (
          <img
            className="mission-notification__image"
            src={src}
            alt="Nouvel objectif de mission"
          />
        )}
      </span>
    </div>
  );
}
