"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, Plus, Download, Trash2,
  Image as ImageIcon, FileSpreadsheet, CheckCircle2,
  ChevronRight, ChevronLeft, Type, Pencil, Check, X,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import * as XLSX from "xlsx";
import { EmployeeData, TemplateConfig, DEFAULT_TEMPLATE, BadgeSize, DEFAULT_BADGE_SIZE } from "../lib/types";
import { generateBadgeZip } from "../lib/pdfGenerator";
import TemplateEditor from "./TemplateEditor";
import styles from "./page.module.css";

export default function BadgeGenerator() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);

  // Resources
  const [background, setBackground] = useState<{ url: string; type: string } | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [customFontName, setCustomFontName] = useState<string | null>(null);
  const [customFontBytes, setCustomFontBytes] = useState<ArrayBuffer | null>(null);

  // Template
  const [template, setTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE);

  // Employees
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [badgeSize, setBadgeSize] = useState<BadgeSize>(DEFAULT_BADGE_SIZE);
  const [formData, setFormData] = useState({
    name: "", jobTitle: "", cpf: "", unop: "", hospital: "",
  });
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Omit<EmployeeData, "id"> & { photoUrl?: string }>({
    name: "", jobTitle: "", cpf: "", unop: "", hospital: "",
  });

  // ─── Register custom font for preview ──────────────────────────
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const bytes = await file.arrayBuffer();
    setCustomFontBytes(bytes);

    const name = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, "");
    setCustomFontName(name);

    // Register via FontFace API for preview
    try {
      const font = new FontFace("CustomBadgeFont", bytes);
      await font.load();
      document.fonts.add(font);
    } catch (err) {
      console.warn("Could not register font for preview:", err);
    }
  };

  // ─── Generic handlers ──────────────────────────────────────────
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackground({ url: URL.createObjectURL(file), type: file.type });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const addEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf) return;
    setEmployees([...employees, { id: crypto.randomUUID(), ...formData, photoUrl: currentPhoto || undefined }]);
    setFormData({ name: "", jobTitle: "", cpf: "", unop: "", hospital: "" });
    setCurrentPhoto(null);
  };

  const removeEmployee = (id: string) => setEmployees(employees.filter((e) => e.id !== id));

  const startEditing = (emp: EmployeeData) => {
    setEditingId(emp.id);
    setEditData({ name: emp.name, jobTitle: emp.jobTitle, cpf: emp.cpf, unop: emp.unop, hospital: emp.hospital, photoUrl: emp.photoUrl });
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = () => {
    if (!editingId) return;
    setEmployees(employees.map((emp) =>
      emp.id === editingId ? { ...emp, ...editData } : emp
    ));
    setEditingId(null);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws) as Record<string, string>[];
      const imported: EmployeeData[] = data
        .map((row) => ({
          id: crypto.randomUUID(),
          name: row.Nome || row.name || "",
          jobTitle: row.Cargo || row.jobTitle || "",
          cpf: String(row.CPF || row.cpf || ""),
          unop: String(row.UNOP || row.unop || ""),
          hospital: row.Hospital || row.hospital || "",
        }))
        .filter((emp) => emp.name && emp.cpf);
      setEmployees((prev) => [...prev, ...imported]);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nome: "João Silva", Cargo: "Gerente", CPF: "123.456.789-00", UNOP: "12345", Hospital: "Hospital Central" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Crachas");
    XLSX.writeFile(wb, "Modelo_Crachas.xlsx");
  };

  const handleGenerate = async () => {
    if (!background || !logo || employees.length === 0) return;
    setIsGenerating(true);
    try {
      await generateBadgeZip(background.url, logo, employees, template, customFontBytes || undefined, badgeSize);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar os crachás. Verifique o console.");
    }
    setIsGenerating(false);
  };

  const canGenerate = background && logo && employees.length > 0 && !isGenerating;

  if (status === "loading") {
    return <main className={styles.main}><div style={{ padding: "4rem", textAlign: "center" }}>Carregando...</div></main>;
  }

  if (!session) {
    return (
      <main className={styles.main}>
        <div style={{ padding: "4rem", textAlign: "center" }} className="material-panel">
          <h2>Acesso Restrito</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "1rem", marginBottom: "2rem" }}>
            Você precisa estar autenticado para utilizar o Gerador de Crachás.
          </p>
          <button onClick={() => signIn("google")} className="btn">
            Faça login com o Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Link href="/" className={`btn btn-outline ${styles.backBtn}`}>
        <ArrowLeft size={18} /> Voltar para o Hub
      </Link>

      <header className={styles.header}>
        <h1 className="title-gradient">Gerador de Crachás em Lote</h1>
        <p className={styles.subtitle}>Monte o template visualmente, adicione os funcionários e gere as imagens PNG.</p>
      </header>

      {/* Step Indicator */}
      <div className={styles.steps}>
        {[
          { n: 1, label: "Recursos" },
          { n: 2, label: "Template" },
          { n: 3, label: "Funcionários" },
        ].map((s) => (
          <button key={s.n}
            className={`${styles.stepItem} ${step === s.n ? styles.stepActive : ""} ${step > s.n ? styles.stepDone : ""}`}
            onClick={() => setStep(s.n)}>
            <span className={styles.stepNum}>{step > s.n ? "✓" : s.n}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ═══════ STEP 1: Resources ═══════ */}
      {step === 1 && (
        <section className={`material-panel ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Recursos Base</h2>
          <p className={styles.sectionDesc}>
            Faça upload do fundo do crachá, da logo e, opcionalmente, de uma fonte customizada (.ttf).
          </p>

          <div className={styles.uploadGrid3}>
            <label className={`${styles.uploadBox} ${background ? styles.uploadDone : ""}`}>
              <input type="file" accept="image/*,application/pdf" onChange={handleBgUpload} hidden />
              <Upload size={28} className={styles.uploadIcon} />
              <span className={styles.uploadLabel}>{background ? "✓ Fundo carregado" : "Fundo do Crachá"}</span>
              <span className={styles.uploadHint}>PNG, JPG, WEBP ou PDF</span>
              {background && <CheckCircle2 size={20} className={styles.checkIcon} />}
            </label>

            <label className={`${styles.uploadBox} ${logo ? styles.uploadDone : ""}`}>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogo)} hidden />
              <ImageIcon size={28} className={styles.uploadIcon} />
              <span className={styles.uploadLabel}>{logo ? "✓ Logo carregada" : "Logo da Empresa"}</span>
              <span className={styles.uploadHint}>PNG, JPG ou WEBP</span>
              {logo && <CheckCircle2 size={20} className={styles.checkIcon} />}
            </label>

            <label className={`${styles.uploadBox} ${customFontName ? styles.uploadDone : ""}`}>
              <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontUpload} hidden />
              <Type size={28} className={styles.uploadIcon} />
              <span className={styles.uploadLabel}>
                {customFontName ? `✓ ${customFontName}` : "Fonte Customizada"}
              </span>
              <span className={styles.uploadHint}>.ttf, .otf (ex: Calibri)</span>
              {customFontName && <CheckCircle2 size={20} className={styles.checkIcon} />}
            </label>
          </div>

          {/* Badge Size Inputs */}
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.75rem" }}>Tamanho do Crachá (cm)</h3>
            <div style={{ display: "flex", gap: "1rem", maxWidth: 400 }}>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Largura (cm)
                <input
                  type="number" step={0.1} min={1} max={30}
                  value={badgeSize.widthCm}
                  onChange={(e) => setBadgeSize({ ...badgeSize, widthCm: Number(e.target.value) })}
                  className={styles.input}
                  style={{ width: "100%" }}
                />
              </label>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Altura (cm)
                <input
                  type="number" step={0.1} min={1} max={30}
                  value={badgeSize.heightCm}
                  onChange={(e) => setBadgeSize({ ...badgeSize, heightCm: Number(e.target.value) })}
                  className={styles.input}
                  style={{ width: "100%" }}
                />
              </label>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-hint)", marginTop: "0.5rem" }}>Padrão: 5,5 × 9 cm. As imagens PNG serão geradas em alta resolução (300 DPI) com marcas de corte.</p>
          </div>

          <div className={styles.stepNav}>
            <div />
            <button className="btn" disabled={!background} onClick={() => setStep(2)}>
              Próximo: Montar Template <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* ═══════ STEP 2: Template Editor ═══════ */}
      {step === 2 && background && (
        <section className={`material-panel ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Montar Template</h2>
          <p className={styles.sectionDesc}>
            Arraste os elementos para posicioná-los. Clique para ajustar fonte, cor e tamanho.
          </p>
          <TemplateEditor
            template={template}
            onChange={setTemplate}
            backgroundUrl={background.url}
            backgroundType={background.type}
            logoUrl={logo}
            customFontName={customFontName}
            badgeSize={badgeSize}
          />
          <div className={styles.stepNav}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>
              <ChevronLeft size={18} /> Anterior
            </button>
            <button className="btn" onClick={() => setStep(3)}>
              Próximo: Funcionários <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* ═══════ STEP 3: Employees + Generate ═══════ */}
      {step === 3 && (
        <section className={`material-panel ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Funcionários</h2>
            <div className={styles.importActions}>
              <button onClick={downloadTemplate} className={styles.linkBtn}>
                <FileSpreadsheet size={14} /> Baixar Modelo Excel
              </button>
              <label className={`btn ${styles.importBtn}`}>
                <Upload size={14} /> Importar Excel/CSV
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} hidden />
              </label>
            </div>
          </div>

          <form onSubmit={addEmployee} className={styles.form}>
            <div className={styles.formRow}>
              <input required placeholder="Nome Completo" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={styles.input} />
              <input required placeholder="Cargo" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.formRow3}>
              <input required placeholder="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} className={styles.input} />
              <input required placeholder="UNOP" value={formData.unop} onChange={(e) => setFormData({ ...formData, unop: e.target.value })} className={styles.input} />
              <input required placeholder="Hospital / Local" value={formData.hospital} onChange={(e) => setFormData({ ...formData, hospital: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.formActions}>
              <label className={styles.photoLabel}>
                <ImageIcon size={16} />
                {currentPhoto ? "Foto adicionada ✓" : "Adicionar Foto"}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setCurrentPhoto)} hidden />
              </label>
              <button type="submit" className="btn"><Plus size={18} /> Adicionar</button>
            </div>
          </form>

          {employees.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>Nome</th><th>Cargo</th><th>CPF</th><th>UNOP</th><th>Hospital</th><th>Foto</th><th></th></tr>
                </thead>
                <tbody>
                  {employees.map((emp, idx) => {
                    const isEditing = editingId === emp.id;
                    return (
                      <tr key={emp.id} className={isEditing ? styles.rowEditing : ""}>
                        <td className={styles.cellIndex}>{idx + 1}</td>
                        <td className={styles.cellName}>
                          {isEditing
                            ? <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className={styles.cellInput} />
                            : emp.name}
                        </td>
                        <td>
                          {isEditing
                            ? <input value={editData.jobTitle} onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })} className={styles.cellInput} />
                            : emp.jobTitle}
                        </td>
                        <td>
                          {isEditing
                            ? <input value={editData.cpf} onChange={(e) => setEditData({ ...editData, cpf: e.target.value })} className={styles.cellInput} />
                            : emp.cpf}
                        </td>
                        <td>
                          {isEditing
                            ? <input value={editData.unop} onChange={(e) => setEditData({ ...editData, unop: e.target.value })} className={styles.cellInput} />
                            : emp.unop}
                        </td>
                        <td>
                          {isEditing
                            ? <input value={editData.hospital} onChange={(e) => setEditData({ ...editData, hospital: e.target.value })} className={styles.cellInput} />
                            : emp.hospital}
                        </td>
                        <td className={styles.cellPhoto}>
                          {isEditing ? (
                            <label className={styles.photoEditLabel} title="Alterar foto">
                              {editData.photoUrl
                                ? <img src={editData.photoUrl} alt="" className={styles.thumbPhoto} />
                                : <span className={styles.photoAdd}><Plus size={14} /></span>
                              }
                              <input type="file" accept="image/*" hidden onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setEditData({ ...editData, photoUrl: URL.createObjectURL(file) });
                              }} />
                            </label>
                          ) : (
                            emp.photoUrl
                              ? <img src={emp.photoUrl} alt="" className={styles.thumbPhoto} />
                              : <span className={styles.noPhoto}>—</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            {isEditing ? (
                              <>
                                <button onClick={saveEditing} className={styles.saveBtn} title="Salvar"><Check size={16} /></button>
                                <button onClick={cancelEditing} className={styles.cancelBtn} title="Cancelar"><X size={16} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditing(emp)} className={styles.editBtn} title="Editar"><Pencil size={16} /></button>
                                <button onClick={() => removeEmployee(emp.id)} className={styles.deleteBtn} title="Remover"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyMsg}>Nenhum funcionário adicionado. Use o formulário acima ou importe uma planilha.</p>
          )}

          <div className={styles.stepNav} style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--surface-border)" }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>
              <ChevronLeft size={18} /> Voltar ao Template
            </button>
            <button onClick={handleGenerate} disabled={!canGenerate} className={`btn ${styles.generateBtn}`}>
              {isGenerating ? "Gerando PNGs..." : <><Download size={20} /> Gerar e Baixar (ZIP)</>}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
