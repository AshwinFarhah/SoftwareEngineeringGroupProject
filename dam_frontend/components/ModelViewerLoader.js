// components/ModelViewerLoader.js
import { useEffect } from "react";

export default function ModelViewerLoader() {
  useEffect(() => {
    // only register <model-viewer> once
    if (!window.customElements.get("model-viewer")) {
      import("@google/model-viewer");
    }
  }, []);

  return null; // nothing to render
}
