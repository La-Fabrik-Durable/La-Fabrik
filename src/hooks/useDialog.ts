import { useState } from "react";

interface DialogState {
  message: string;
  visible: boolean;
}

export function useDialog(): {
  dialog: DialogState;
  showDialog: (message: string) => void;
  hideDialog: () => void;
} {
  const [dialog, setDialog] = useState<DialogState>({
    message: "",
    visible: false,
  });

  const showDialog = (message: string): void => {
    setDialog({ message, visible: true });
  };

  const hideDialog = (): void => {
    setDialog((prev) => ({ ...prev, visible: false }));
  };

  return { dialog, showDialog, hideDialog };
}
