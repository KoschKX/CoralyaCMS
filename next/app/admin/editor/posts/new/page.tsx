import { getSettings } from "@/lib/settings-db";
import PostEditorPage from "../../PostEditorPage";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  const { disabledBlocks } = getSettings();
  return <PostEditorPage disabledBlocks={disabledBlocks} />;
}
