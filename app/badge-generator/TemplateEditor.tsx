"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./TemplateEditor.module.css";
import { TemplateConfig, ElementConfig, BadgeSize, DEFAULT_BADGE_SIZE } from "../lib/types";

interface TemplateEditorProps {
  template: TemplateConfig;
  onChange: (t: TemplateConfig) => void;
  backgroundUrl: string;
  backgroundType: string;
  logoUrl: string | null;
  customFontName: string | null;
  badgeSize?: BadgeSize;
}

const SAMPLE_DATA: Record<string, string> = {
  name: "NOME DO FUNCIONÁRIO",
  jobTitle: "CARGO / FUNÇÃO",
  cpf: "CPF: 123.456.789-00",
  unop: "UNOP 12345",
  hospital: "HOSPITAL CENTRAL",
};

const FONT_CSS_MAP: Record<string, string> = {
  helvetica: "Helvetica, Arial, sans-serif",
  times: "'Times New Roman', Times, serif",
  courier: "'Courier New', Courier, monospace",
  calibri: "Calibri, sans-serif",
  custom: "CustomBadgeFont, sans-serif",
};



export default function TemplateEditor({
  template,
  onChange,
  backgroundUrl,
  backgroundType,
  logoUrl,
  customFontName,
  badgeSize,
}: TemplateEditorProps) {
  const size = badgeSize || DEFAULT_BADGE_SIZE;
  const BADGE_ASPECT = size.widthCm / size.heightCm;
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(450);

  const sideConfig = template[activeSide];
  const selectedElement = selectedKey ? sideConfig[selectedKey] : null;

  // ─── Measure container ─────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pageHeightPt = size.heightCm * 28.3464566929;
  const ptToPx = containerHeight / pageHeightPt;

  // ─── Update helpers ────────────────────────────────────
  const updateElement = useCallback(
    (key: string, updates: Partial<ElementConfig>) => {
      onChange({
        ...template,
        [activeSide]: {
          ...template[activeSide],
          [key]: { ...template[activeSide][key], ...updates },
        },
      });
    },
    [template, activeSide, onChange]
  );

  // ─── Drag handlers ────────────────────────────────────
  const handleMouseDown = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const elRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging(key);
    setDragOffset({ x: e.clientX - elRect.left, y: e.clientY - elRect.top });
    setSelectedKey(key);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cfg = sideConfig[dragging];
      if (!cfg) return;

      const newX = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
      const newY = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;

      updateElement(dragging, {
        xPercent: Math.max(0, Math.min(100 - cfg.widthPercent, newX)),
        yPercent: Math.max(0, Math.min(100 - cfg.heightPercent, newY)),
      });
    },
    [dragging, dragOffset, sideConfig, updateElement]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Deselect only when clicking empty area
  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.target === containerRef.current) {
      setSelectedKey(null);
    }
  };

  return (
    <div className={styles.editor}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeSide === "front" ? styles.tabActive : ""}`}
          onClick={() => { setActiveSide("front"); setSelectedKey(null); }}
        >
          Frente
        </button>
        <button
          className={`${styles.tab} ${activeSide === "back" ? styles.tabActive : ""}`}
          onClick={() => { setActiveSide("back"); setSelectedKey(null); }}
        >
          Verso
        </button>
      </div>

      <div className={styles.editorBody}>
        {/* ─── Preview ────────────────────────── */}
        <div className={styles.previewWrapper} onClick={handleBgClick}>
          <div
            ref={containerRef}
            className={styles.previewContainer}
            style={{ aspectRatio: `${BADGE_ASPECT}` }}
            onClick={handleBgClick}
          >
            {/* Background image (PDFs are converted to images at upload time) */}
            <img src={backgroundUrl} alt="Fundo" className={styles.bgImage} draggable={false} />

            {/* Margin Guides */}
            <div className={styles.marginGuide} />

            {/* Overlay elements */}
            {Object.entries(sideConfig).map(([key, cfg]) => {
              const isSelected = selectedKey === key;

              const baseStyle: React.CSSProperties = {
                left: `${cfg.xPercent}%`,
                top: `${cfg.yPercent}%`,
                width: `${cfg.widthPercent}%`,
                height: `${cfg.heightPercent}%`,
                cursor: dragging === key ? "grabbing" : "grab",
              };

              if (cfg.type === "text") {
                const cssFontFamily = FONT_CSS_MAP[cfg.fontFamily] || FONT_CSS_MAP.helvetica;
                return (
                  <div
                    key={key}
                    className={`${styles.element} ${isSelected ? styles.elementSelected : ""}`}
                    style={baseStyle}
                    onMouseDown={(e) => handleMouseDown(key, e)}
                    onClick={(e) => { e.stopPropagation(); setSelectedKey(key); }}
                  >
                    <span
                      style={{
                        fontSize: `${Math.max(cfg.fontSize * ptToPx, 8)}px`,
                        color: cfg.fontColor,
                        fontWeight: cfg.fontWeight === "bold" ? 700 : 400,
                        fontFamily: cssFontFamily,
                        textAlign: "center",
                        display: "block",
                        lineHeight: 1.05,
                        overflow: "hidden",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        width: "100%",
                      }}
                    >
                      {SAMPLE_DATA[key] || cfg.label}
                    </span>
                    <span className={styles.elementLabel}>{cfg.label}</span>
                  </div>
                );
              }

              // Image element
              const imgSrc = key === "logo" ? logoUrl : null;
              return (
                <div
                  key={key}
                  className={`${styles.element} ${styles.imageElement} ${isSelected ? styles.elementSelected : ""}`}
                  style={{ ...baseStyle, borderRadius: cfg.circular ? "50%" : "4px" }}
                  onMouseDown={(e) => handleMouseDown(key, e)}
                  onClick={(e) => { e.stopPropagation(); setSelectedKey(key); }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={cfg.label}
                      className={styles.previewImg}
                      style={{ borderRadius: cfg.circular ? "50%" : "4px" }}
                      draggable={false}
                    />
                  ) : (
                    <div className={styles.placeholder} style={{ borderRadius: cfg.circular ? "50%" : "4px" }}>
                      {cfg.label}
                    </div>
                  )}
                  <span className={styles.elementLabel}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Properties Panel ───────────────── */}
        <div className={styles.propsPanel}>
          <h3 className={styles.propsPanelTitle}>Propriedades</h3>

          {!selectedElement || !selectedKey ? (
            <p className={styles.propsHint}>
              Clique em um elemento no preview para editar suas propriedades.
            </p>
          ) : (
            <div className={styles.propsForm}>
              <div className={styles.propName}>{selectedElement.label}</div>

              {/* Position & Size */}
              <div className={styles.propGrid}>
                <label className={styles.propLabel}>
                  X (%)
                  <input type="number" min={0} max={100} step={0.5}
                    value={Math.round(selectedElement.xPercent * 10) / 10}
                    onChange={(e) => updateElement(selectedKey, { xPercent: Number(e.target.value) })}
                    className={styles.propInput} />
                </label>
                <label className={styles.propLabel}>
                  Y (%)
                  <input type="number" min={0} max={100} step={0.5}
                    value={Math.round(selectedElement.yPercent * 10) / 10}
                    onChange={(e) => updateElement(selectedKey, { yPercent: Number(e.target.value) })}
                    className={styles.propInput} />
                </label>
                <label className={styles.propLabel}>
                  Larg. (%)
                  <input type="number" min={1} max={100} step={1}
                    value={Math.round(selectedElement.widthPercent)}
                    onChange={(e) => updateElement(selectedKey, { widthPercent: Number(e.target.value) })}
                    className={styles.propInput} />
                </label>
                <label className={styles.propLabel}>
                  Alt. (%)
                  <input type="number" min={1} max={100} step={1}
                    value={Math.round(selectedElement.heightPercent)}
                    onChange={(e) => updateElement(selectedKey, { heightPercent: Number(e.target.value) })}
                    className={styles.propInput} />
                </label>
              </div>

              {/* Text properties */}
              {selectedElement.type === "text" && (
                <>
                  <label className={styles.propLabel}>
                    Fonte
                    <select
                      value={selectedElement.fontFamily}
                      onChange={(e) => updateElement(selectedKey, { fontFamily: e.target.value as ElementConfig["fontFamily"] })}
                      className={styles.propInput}
                    >
                      <option value="helvetica">Helvetica</option>
                      <option value="calibri">Calibri</option>
                      <option value="times">Times New Roman</option>
                      <option value="courier">Courier</option>
                      {customFontName && <option value="custom">{customFontName}</option>}
                    </select>
                  </label>

                  <div className={styles.propGrid}>
                    <label className={styles.propLabel}>
                      Tamanho (pt)
                      <input type="number" min={4} max={40} step={1}
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedKey, { fontSize: Number(e.target.value) })}
                        className={styles.propInput} />
                    </label>
                    <label className={styles.propLabel}>
                      Peso
                      <select value={selectedElement.fontWeight}
                        onChange={(e) => updateElement(selectedKey, { fontWeight: e.target.value as "normal" | "bold" })}
                        className={styles.propInput}>
                        <option value="normal">Normal</option>
                        <option value="bold">Negrito</option>
                      </select>
                    </label>
                  </div>

                  <label className={styles.propLabel}>
                    Cor
                    <div className={styles.colorRow}>
                      <input type="color" value={selectedElement.fontColor}
                        onChange={(e) => updateElement(selectedKey, { fontColor: e.target.value })}
                        className={styles.colorPicker} />
                      <input type="text" value={selectedElement.fontColor}
                        onChange={(e) => updateElement(selectedKey, { fontColor: e.target.value })}
                        className={styles.propInput} style={{ flex: 1 }} />
                    </div>
                  </label>
                </>
              )}

              {/* Image properties */}
              {selectedElement.type === "image" && (
                <label className={styles.propCheckLabel}>
                  <input type="checkbox" checked={selectedElement.circular}
                    onChange={(e) => updateElement(selectedKey, { circular: e.target.checked })} />
                  Corte circular
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
