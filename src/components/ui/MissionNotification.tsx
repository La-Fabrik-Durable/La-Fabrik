import { MISSION_NOTIFICATION_IMAGE_PATHS } from "@/data/gameplay/missionNotifications";
import type { RepairMissionId } from "@/types/gameplay/repairMission";

// Reference aspect ratio of the original PNG mission notifications
// (589 × 211). Webm assets are square (2000 × 2000), so without this hint the
// <video> element renders at the wrong dimensions and shifts the layout.
const NOTIFICATION_ASPECT_RATIO = "589 / 211";

// Same clip-path as `.mission-notification__image-wrap` in index.css. Inlined
// here so the video branch can re-use the silhouette without inheriting the
// scan-line `::before` and CRT animations applied to the PNG branch.
const NOTIFICATION_CLIP_PATH =
  "polygon(0 0, 100% 0, 100% 69%, 88% 100%, 0 100%)";

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
      // Webm assets already animate themselves; suppress the CRT entrance
      // flicker + drop-shadow that index.css applies to all .mission-notification
      // nodes so the video plays in a clean container.
      style={
        isVideo
          ? {
              animation: "none",
              filter: "none",
            }
          : undefined
      }
      aria-live="polite"
    >
      {isVideo ? null : <div className="mission-notification__glow" />}
      {isVideo ? (
        <span
          style={{
            position: "relative",
            display: "block",
            overflow: "hidden",
            clipPath: NOTIFICATION_CLIP_PATH,
          }}
        >
          <video
            style={{
              display: "block",
              width: "100%",
              height: "auto",
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
        </span>
      ) : (
        <span className="mission-notification__image-wrap">
          <img
            className="mission-notification__image"
            src={src}
            alt="Nouvel objectif de mission"
          />
        </span>
      )}
    </div>
  );
}
