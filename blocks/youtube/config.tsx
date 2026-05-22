import type { BlockDefinition } from "@/lib/block-types";
import YoutubeLayout from "./layout";
import { YoutubePanelControls } from "./panel";

const youtube: BlockDefinition = {
  name: "youtube",
  label: "YouTube",
  icon: "youtube",
  category: "media",
  defaultData: {
    url:         "",
    title:       "",
    aspectRatio: "16:9",
    maxWidth:    "",
    alignment:   "center",
    autoplay:    false,
    mute:        false,
    loop:        false,
    controls:    true,
    startTime:   "",
    endTime:     "",
    privacy:     false,
  },
  Layout:        YoutubeLayout,
  PanelControls: YoutubePanelControls,
};

export default youtube;
