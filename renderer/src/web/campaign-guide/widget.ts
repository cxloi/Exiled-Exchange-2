import { Anchor, Widget } from "../overlay/widgets";

type Guide = {
  section?: boolean;
  optional: boolean;
  text: string;
  location?: string;
  attr?: string;
  skill?: string;
  item?: string;
  trial?: string;
};
type Map = {
  mapId: string;
  name: string;
  guides: Guide[];
}

export interface CampaignGuideWidget extends Widget {
  anchor: Anchor;
  maps: Map[];
}
