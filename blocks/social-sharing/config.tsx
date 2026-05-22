import type { BlockDefinition } from "@/lib/block-types";
import SocialSharingLayout from "./layout";
import { SocialSharingPanelControls } from "./panel";

/**
 * Social Sharing block — renders a configurable row of share-link icons.
 *
 * Mirrors the functionality of the Fusion Builder `[fusion_sharing]` shortcode.
 * The share URL and page title are resolved client-side from window.location
 * unless overridden in the block data.
 *
 * @example data
 * {
 *   tagline: "Share this:",
 *   taglineTag: "h4",
 *   taglinePlacement: "before",
 *   networks: ["facebook","twitter","bluesky","reddit","linkedin","whatsapp","email","copy_link"],
 *   iconSize: "20px",
 *   iconsBoxed: false,
 *   iconsBoxedRadius: "4px",
 *   colorType: "brand",
 *   iconColor: "",
 *   boxColor: "",
 *   bgColor: "",
 *   alignment: "flex-start",
 *   url: "",
 *   title: "",
 *   description: "",
 * }
 */
const socialSharing: BlockDefinition = {
  name: "social-sharing",
  label: "Social Sharing",
  icon: "share",
  category: "design",
  defaultData: {
    tagline: "Share this:",
    taglineTag: "h4",
    taglinePlacement: "before",
    networks: [
      "facebook",
      "twitter",
      "bluesky",
      "reddit",
      "linkedin",
      "whatsapp",
      "email",
      "copy_link",
    ],
    iconSize: "20px",
    iconsBoxed: false,
    iconsBoxedRadius: "4px",
    colorType: "brand",
    iconColor: "",
    boxColor: "",
    bgColor: "",
    alignment: "flex-start",
    url: "",
    title: "",
    description: "",
    customNetworks: [],
  },
  Layout: SocialSharingLayout,
  PanelControls: SocialSharingPanelControls,
};

export default socialSharing;
