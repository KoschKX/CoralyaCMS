import EditorPage from "../EditorPage";
import { getSettings } from "@/lib/settings-db";

export const metadata = { title: "New Page — Admin" };

export default function NewPage() {
  const { disabledBlocks, languages } = getSettings();
  return <EditorPage disabledBlocks={disabledBlocks} languages={languages} initialTranslations={{}} />;
}
