import { createElement, type IconNode } from "lucide";

import {
  isRuntimeReadyAsset,
  requireAssetByKey,
} from "../bootstrap/assetCatalogV2";

export const createControlIcon = (icon: IconNode) => {
  const asset = requireAssetByKey("library-lucide-controls");
  if (!isRuntimeReadyAsset(asset))
    throw new Error("Control icon source is blocked");
  return createElement(icon);
};
