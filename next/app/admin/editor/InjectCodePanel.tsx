"use client";

interface InjectFields {
  tracking: string;
  head: string;
  beforeBody: string;
  afterBody: string;
}

interface InjectCodePanelProps {
  fields: InjectFields;
  onChange: (fields: InjectFields) => void;
  onClose: () => void;
}

export default function InjectCodePanel({ fields, onChange, onClose }: InjectCodePanelProps) {
  return (
    <div className="max-w-2xl mx-auto mt-8 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-zinc-700">Inject Code</h2>
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded border border-zinc-200">
          Back
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 mb-1">Tracking Code</label>
          <textarea
            className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
            placeholder="Paste your tracking code here. This will be added into the header template of your theme. Place code inside <script> tags."
            value={fields.tracking}
            onChange={(e) => onChange({ ...fields, tracking: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 mb-1">Space Before &lt;head&gt;</label>
          <textarea
            className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
            placeholder="Only accepts JavaScript code wrapped with <script> tags and HTML markup that is valid inside the <head> tag."
            value={fields.head}
            onChange={(e) => onChange({ ...fields, head: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 mb-1">Space After &lt;body&gt;</label>
          <textarea
            className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
            placeholder="Only accepts JavaScript code, wrapped with <script> tags and valid HTML markup inside the <body> tag."
            value={fields.afterBody}
            onChange={(e) => onChange({ ...fields, afterBody: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 mb-1">Space Before &lt;/body&gt;</label>
          <textarea
            className="w-full border rounded p-2 text-xs font-mono min-h-[60px]"
            placeholder="Only accepts JavaScript code and valid HTML markup inside the <body> tag."
            value={fields.beforeBody}
            onChange={(e) => onChange({ ...fields, beforeBody: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
