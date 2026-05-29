import mainFeature from "../../../../docs/user/main-feature.md?raw";
import { DocsDocument } from "@/components/docs/DocsDocument";

export function DocsMainFeaturePage(): React.JSX.Element {
  return <DocsDocument content={mainFeature} meta="13" title="Main Feature" />;
}
