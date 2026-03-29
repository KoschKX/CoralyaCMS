console.log("[EditorJsColumnsTool] Local fork loaded and running");
// Forked and simplified: EditorJS Columns block with row wrapping logic for the visual editor
import React from "react";
import ReactDOM from "react-dom";




// EditorJS Tool class wrapper
class EditorJsColumnsTool {
  static get toolbox() {
    return { title: "Columns", icon: "⊟" };
  }

  constructor({ data, config }, api) {
    this.data = data || { cols: [] };
    this.config = config || {};
    this.api = api;
    this._container = null;
  }

  render() {
    this._container = document.createElement("div");
    // Handler to update data and notify EditorJS
    const handleDataChange = (newCols) => {
      this.data.cols = newCols;
      // Try to update block data via EditorJS API if available
      if (this.api && this.api.blocks && typeof this.api.blocks.update === "function") {
        // Find current block index and update
        const idx = this.api.blocks.getCurrentBlockIndex();
        const block = this.api.blocks.getBlockByIndex(idx);
        if (block && block.id) {
          this.api.blocks.update(block.id, this.data);
        }
      } else {
        // Fallback: dispatch input event
        if (typeof this._container.dispatchEvent === "function") {
          this._container.dispatchEvent(new CustomEvent("input"));
        }
      }
      if (this.config.onDataChange) {
        this.config.onDataChange(this.data);
      }
    };
    ReactDOM.render(
      <EditorJsColumnsWrapper
        data={this.data}
        renderBlocks={this.config.renderBlocks || (() => null)}
        onDataChange={handleDataChange}
      />,
      this._container
    );
    return this._container;
  }

  save() {
    // Return the current data (could be enhanced for editing support)
    return this.data;
  }
}

export default EditorJsColumnsTool;




function widthToPercent(w) {
  // Responsive/row-wrapping logic copied from ColumnsGrid
  function getColWidth(colIdx, vp, colWidths, responsive) {
    if (vp !== "desktop") {
      const key = `col-${colIdx}-width`;
      const vpOverrides = responsive?.[vp];
      if (vpOverrides && key in vpOverrides) return vpOverrides[key] || "1fr";
    }
    return colWidths[colIdx] || "1fr";
  }
  if (!w) return 100;
  if (typeof w === "number") return w;
  if (w.endsWith("%")) return parseFloat(w);
  if (w.endsWith("fr")) return 100;
  const n = parseFloat(w);
  return isNaN(n) ? 100 : n;
}

/**
 * EditorJsColumnsWrapper: a React component for the visual editor, mimicking ColumnsGrid row wrapping
 * Expects props: { data: { cols: [{ width, blocks }], responsive }, renderBlocks }
 */
function EditorJsColumnsWrapper({ data, renderBlocks, onDataChange }) {
    // Debug: show tool is running
    React.useEffect(() => {
      console.log('[EditorJsColumnsWrapper] Rendered. Row grouping:', rows.map(r => r.idxs));
    }, [rows.length, cols]);
  // --- Begin: ColumnsGrid parity logic ---
  const [cols, setCols] = React.useState((data?.cols ?? []).map((col) => ({ ...col, width: col.width || "1fr" })));
  const responsive = data?.responsive || {};
  // For now, always use desktop viewport in editor
  const editorViewport = 'desktop';
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange(cols);
    }
  }, [cols, onDataChange]);
  const colWidths = cols.map((col) => col.width || "1fr");
  function getColWidth(colIdx, vp) {
    if (vp !== "desktop") {
      const key = `col-${colIdx}-width`;
      const vpOverrides = responsive[vp];
      if (vpOverrides && key in vpOverrides) return vpOverrides[key] || "1fr";
    }
    return colWidths[colIdx] || "1fr";
  }
  const vp = editorViewport;
  const widths = colWidths.map((_, i) => getColWidth(i, vp));
  const percentWidths = widths.map(widthToPercent);
  const childArray = cols;
  const rows = [];
  let currentRow = [];
  let currentIdxs = [];
  let currentSum = 0;
  for (let i = 0; i < childArray.length; i++) {
    const w = percentWidths[i] || 100;
    if (currentSum + w > 100 && currentRow.length > 0) {
      rows.push({ cols: currentRow, idxs: currentIdxs });
      currentRow = [];
      currentIdxs = [];
      currentSum = 0;
    }
    currentRow.push(childArray[i]);
    currentIdxs.push(i);
    currentSum += w;
  }
  if (currentRow.length > 0) {
    rows.push({ cols: currentRow, idxs: currentIdxs });
  }
  // --- End: ColumnsGrid parity logic ---

  // UI for editing column widths
  const handleWidthChange = (idx, value) => {
    setCols(cols => cols.map((col, i) => i === idx ? { ...col, width: value } : col));
  };

  React.useEffect(() => {
    // Log DOM structure for debugging
    setTimeout(() => {
      const wrapper = document.querySelector('.block-columns-wrapper');
      if (wrapper) {
        // eslint-disable-next-line no-console
        console.log('[EditorJsColumnsWrapper] .block-columns-wrapper children:', wrapper.children);
      }
    }, 100);
  }, [rows.length]);

  return (
    <>
      {/* CSS overrides to force correct layout in editor */}
      <style>{`
        .block-columns-wrapper, .block-columns__col-wrapper {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .block-columns.grid {
          display: grid !important;
          grid-auto-flow: row !important;
        }
        .block-columns__col-wrapper {
          display: block !important;
        }
      `}</style>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        {cols.map((col, idx) => (
          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Width:
            <input
              type="text"
              value={col.width}
              onChange={e => handleWidthChange(idx, e.target.value)}
              style={{ width: 60 }}
              placeholder="1fr or 50%"
            />
          </label>
        ))}
      </div>
      {/* Debug output for row grouping */}
      <pre style={{ fontSize: 14, color: '#b71c1c', background: '#fffde7', padding: 12, marginBottom: 12, border: '2px solid #b71c1c' }}>
        [EditorJsColumnsWrapper] DEBUG\nRows: {rows.length}\n{rows.map((row, i) => `Row ${i + 1}: [${row.idxs.map(idx => `${widths[idx]}`).join(', ')}] (sum: ${row.idxs.map(idx => widthToPercent(widths[idx])).reduce((a, b) => a + b, 0)})`).join('\n')}
      </pre>
      {rows.length === 1 && (
        <div style={{ color: 'red', fontWeight: 'bold', marginBottom: 8 }}>
          Warning: Only one row rendered. Columns are not wrapping. Check CSS or parent container constraints.
        </div>
      )}
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={`block-columns-row editorjs-columns-row-${rowIdx}`}
          style={{
            display: 'block',
            width: '100%',
            minWidth: 0,
            marginBottom: rowIdx < rows.length - 1 ? '1rem' : undefined,
            border: '3px solid #e91e63',
            background: rowIdx % 2 === 0 ? '#ffe4e1' : '#e0f7fa',
            boxSizing: 'border-box',
            clear: 'both',
            minHeight: 80,
          }}
        >
          <div
            className="block-columns grid"
            style={{
              display: 'grid',
              gridTemplateColumns: row.idxs.map(i => widths[i]).join(' '),
              gridAutoFlow: 'row',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              minHeight: 80,
            }}
          >
            {row.cols.map((col, i) => (
              <div
                key={i}
                style={{
                  paddingLeft: i === 0 ? 0 : '0.75rem',
                  paddingRight: i === row.cols.length - 1 ? 0 : '0.75rem',
                  boxSizing: 'border-box',
                  width: '100%',
                  minWidth: 0,
                  minHeight: 60,
                  background: i % 2 === 0 ? '#fffde7' : '#e1bee7',
                  border: '2px dashed #2196f3',
                }}
                className="block-columns__col-wrapper"
              >
                <div className="block-columns__col min-w-0">
                  {renderBlocks ? renderBlocks(col.blocks ?? []) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
