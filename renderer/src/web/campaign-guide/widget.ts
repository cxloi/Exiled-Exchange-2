import { Anchor, Widget } from "../overlay/widgets";

export type Guide = {
  section?: boolean;
  optional: boolean;
  text: string;
  attr?: string;
  item?: string;
};
export type Map = {
  mapId: string;
  name: string;
  guides: Guide[];
}

export interface CampaignGuideWidget extends Widget {
  anchor: Anchor;
  maps: Map[];
}
