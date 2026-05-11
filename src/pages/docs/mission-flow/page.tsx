import missionFlow from "../../../../docs/technical/mission-flow.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";
import { missionFlowFr } from "@/data/docs/docsTranslations";

export function DocsMissionFlowPage(): React.JSX.Element {
  return (
    <DocsDocument
      content={missionFlow}
      frContent={missionFlowFr}
      meta="07"
      title="Mission Flow"
    />
  );
}
