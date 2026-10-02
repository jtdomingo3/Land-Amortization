import React from 'react';
import {
  Printer,
  FileText,
  Sliders,
  RotateCw,
  RefreshCw,
  Minus,
  Plus,
  CheckCircle2,
  Zap
} from 'lucide-react';

export function PrintControlBar({
  printers = [],
  selectedPrinter = '',
  onSelectPrinter,
  paperSize = 'A4',
  onSelectPaperSize,
  orientation = 'portrait',
  onSelectOrientation,
  marginType = 'default',
  onSelectMarginType,
  copies = 1,
  onSelectCopies,
  onRefreshPrinters,
  isLoadingPrinters = false,
  documentType = 'soa' // 'soa' | 'receipt'
}) {
  const handleCopiesChange = (delta) => {
    const nextVal = Math.min(99, Math.max(1, Number(copies) + delta));
    onSelectCopies(nextVal);
  };

  return (
    <div
      className="print-control-bar"
      style={{
        background: 'var(--bg-card)',
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
        fontSize: '0.78rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* 1. Printer Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-cyan)', fontWeight: 700 }}>
            <Printer size={15} />
            <span>Printer:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <select
              className="form-input"
              value={selectedPrinter}
              onChange={(e) => onSelectPrinter(e.target.value)}
              style={{
                fontSize: '0.76rem',
                padding: '4px 8px',
                height: 30,
                minWidth: 170,
                maxWidth: 240,
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
                borderRadius: 6,
                fontWeight: 600
              }}
              title="Select printer hardware or PDF driver"
            >
              <option value="">System Default Printer</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.isDefault ? '★ (Default)' : ''}
                </option>
              ))}
            </select>

            {onRefreshPrinters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onRefreshPrinters}
                title="Refresh connected printers"
                style={{ padding: '4px 6px', height: 30 }}
                disabled={isLoadingPrinters}
              >
                <RefreshCw size={13} className={isLoadingPrinters ? 'spin' : ''} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Paper Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-emerald)', fontWeight: 700 }}>
            <FileText size={15} />
            <span>Paper:</span>
          </div>

          <select
            className="form-input"
            value={paperSize}
            onChange={(e) => onSelectPaperSize(e.target.value)}
            style={{
              fontSize: '0.76rem',
              padding: '4px 8px',
              height: 30,
              minWidth: 120,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-subtle)',
              borderRadius: 6,
              fontWeight: 600
            }}
            title="Select target paper dimensions"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="Letter">Letter (8.5 × 11 in)</option>
            <option value="Legal">Legal (8.5 × 14 in)</option>
            <option value="Roll80">80mm Thermal Roll</option>
            <option value="Roll58">58mm Thermal Roll</option>
          </select>
        </div>

        {/* 3. Orientation Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Layout:</span>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-input)',
              borderRadius: 6,
              padding: 2,
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${orientation === 'portrait' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.72rem', padding: '3px 9px', height: 26 }}
              onClick={() => onSelectOrientation('portrait')}
              title="Portrait (Vertical)"
            >
              Portrait
            </button>
            <button
              type="button"
              className={`btn btn-sm ${orientation === 'landscape' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.72rem', padding: '3px 9px', height: 26 }}
              onClick={() => onSelectOrientation('landscape')}
              title="Landscape (Horizontal)"
            >
              Landscape
            </button>
          </div>
        </div>

        {/* 4. Margins Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontWeight: 700 }}>
            <Sliders size={14} />
            <span>Margin:</span>
          </div>

          <select
            className="form-input"
            value={marginType}
            onChange={(e) => onSelectMarginType(e.target.value)}
            style={{
              fontSize: '0.76rem',
              padding: '4px 8px',
              height: 30,
              minWidth: 110,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-subtle)',
              borderRadius: 6,
              fontWeight: 600
            }}
            title="Select document margins"
          >
            <option value="default">Normal (10mm)</option>
            <option value="narrow">Narrow (5mm)</option>
            <option value="none">None (0mm)</option>
            <option value="wide">Wide (20mm)</option>
          </select>
        </div>

        {/* 5. Copies Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Copies:</span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              height: 30
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleCopiesChange(-1)}
              disabled={copies <= 1}
              style={{ padding: '0 6px', height: '100%', borderRight: '1px solid var(--border-subtle)', borderRadius: 0 }}
              title="Decrease Copies"
            >
              <Minus size={11} />
            </button>
            <input
              type="number"
              min={1}
              max={99}
              value={copies}
              onChange={(e) => onSelectCopies(Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1)))}
              style={{
                width: 38,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.76rem',
                outline: 'none',
                padding: '0 2px'
              }}
              title="Number of copies"
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleCopiesChange(1)}
              disabled={copies >= 99}
              style={{ padding: '0 6px', height: '100%', borderLeft: '1px solid var(--border-subtle)', borderRadius: 0 }}
              title="Increase Copies"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Indicator: Silent Print Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          className="badge badge-success"
          style={{
            fontSize: '0.7rem',
            padding: '3px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 700
          }}
          title="Direct print spools straight to printer with zero Windows popups"
        >
          <Zap size={11} />
          <span>Direct Print (No Dialog)</span>
        </span>
      </div>
    </div>
  );
}

export default PrintControlBar;
