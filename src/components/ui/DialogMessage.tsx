import { useEffect, useState } from "react";

interface DialogMessageProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function DialogMessage({
  message,
  duration = 3000,
  onClose,
}: DialogMessageProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: "1rem 2rem",
        borderRadius: "8px",
        border: "2px solid #fff",
        zIndex: 200,
        maxWidth: "80%",
      }}
    >
      <p
        style={{
          color: "#fff",
          margin: 0,
          fontSize: "1rem",
          textAlign: "center",
        }}
      >
        {message}
      </p>
    </div>
  );
}
