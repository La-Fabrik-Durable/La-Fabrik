import type { SiteCardConfig } from "@/data/site/siteConfig";

interface SiteCardProps {
  config: SiteCardConfig;
  selected: boolean;
  onSelect: () => void;
}

export function SiteCard({
  config,
  selected,
  onSelect,
}: SiteCardProps): React.JSX.Element {
  const { label, imagePath, disabled } = config;

  const getBackground = (): string => {
    if (imagePath) return `url(${imagePath}) center/cover`;
    if (disabled) return "#b8b8b8";
    if (selected) return "#d9d9d9";
    return "#e8e8e8";
  };

  const getBorder = (): string => {
    if (selected) return "3px solid #a8d5a2";
    if (disabled) return "none";
    return "2px solid #ffffff";
  };

  const getTextColor = (): string => {
    if (disabled) return "#888888";
    return "#666666";
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      style={{
        width: "clamp(120px, 15vw, 160px)",
        height: "clamp(140px, 18vw, 180px)",
        border: getBorder(),
        background: getBackground(),
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        outline: "none",
        flexShrink: 0,
      }}
    >
      {!imagePath && (
        <span
          style={{
            color: getTextColor(),
            fontSize: "clamp(10px, 1.5vw, 14px)",
            fontWeight: 500,
            textAlign: "center",
            padding: 8,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
