import type { BlockDefinition } from "@/lib/block-types";
import VideoLayout from "./layout";
import { VideoPanelControls } from "./panel";

const video: BlockDefinition = {
  name: "video",
  label: "Video",
  icon: "video-file",
  category: "media",
  defaultData: {
    mp4:          "",
    webm:         "",
    poster:       "",
    autoplay:     false,
    mute:         false,
    loop:         false,
    controls:     true,
    preload:      "metadata",
    startTime:    "",
    endTime:      "",
    maxWidth:     "100%",
    alignment:    "center",
    borderRadius: "",
    overlayColor: "",
  },
  Layout:        VideoLayout,
  PanelControls: VideoPanelControls,
};

export default video;
