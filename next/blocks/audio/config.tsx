import type { BlockDefinition } from "@/lib/block-types";
import AudioLayout from "./layout";
import { AudioPanelControls } from "./panel";

const audio: BlockDefinition = {
  name: "audio",
  label: "Audio",
  icon: "audio",
  category: "media",
  defaultData: {
    sourceType:   "hosted",
    // ── hosted ────────────────────────────────────────────────────
    src:          "",
    loop:         false,
    autoplay:     false,
    controls:     true,
    preload:      "metadata",
    // ── soundcloud ────────────────────────────────────────────────
    url:          "",
    visual:       false,
    hideRelated:  true,
    showComments: false,
    showUser:     true,
    showReposts:  false,
    showTeaser:   false,
    color:        "",
    // ── display (shared) ──────────────────────────────────────────
    maxWidth:     "100%",
    alignment:    "center",
    borderRadius: "",
    title:        "",
  },
  Layout:        AudioLayout,
  PanelControls: AudioPanelControls,
};

export default audio;
