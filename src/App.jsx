import { useState, useEffect, useCallback, useRef } from "react";

const SAMPLE_ENTRIES = [
  {
    id: "exp-001",
    title: "RNA-Seq Differential Expression Analysis",
    date: "2025-01-15",
    tags: ["RNA-Seq", "DESeq2", "transcriptomics"],
    status: "complete",
    markdown: `## Objective\nCompare gene expression between treatment and control groups using DESeq2 pipeline.\n\n## Methods\n- Trimmed reads with Trimmomatic (LEADING:3 TRAILING:3 SLIDINGWINDOW:4:15)\n- Aligned to GRCh38 with STAR v2.7.10\n- Quantified with featureCounts\n- Differential expression with DESeq2 (padj < 0.05, |log2FC| > 1)\n\n## Key Results\n- **2,341** genes differentially expressed\n- **1,102** upregulated, **1,239** downregulated\n- Top pathway: *TNF signaling via NF-κB* (FDR = 2.3e-12)\n\n## Conclusions\nStrong inflammatory signature in treatment group. Follow up with GSEA and network analysis.\n\n## Files\n- \`deseq2_results.html\` — Interactive volcano plot & results table\n- \`pathway_enrichment.html\` — GSEA enrichment visualization`,
    htmlFiles: ["deseq2_results.html", "pathway_enrichment.html"],
  },
  {
    id: "exp-002",
    title: "Variant Calling Pipeline — WGS Cohort",
    date: "2025-02-03",
    tags: ["WGS", "GATK", "variant-calling", "genomics"],
    status: "complete",
    markdown: `## Objective\nCall germline variants across 48-sample WGS cohort using GATK best practices.\n\n## Pipeline\n1. BWA-MEM2 alignment → GRCh38\n2. MarkDuplicates (Picard)\n3. Base Quality Score Recalibration\n4. HaplotypeCaller (GVCF mode)\n5. GenomicsDBImport → GenotypeGVCFs\n6. VQSR filtering (SNPs + Indels)\n\n## Results\n- **4.2M** SNVs passed filters (Ti/Tv = 2.07)\n- **812K** indels passed filters\n- Mean coverage: 32.4x (range: 28.1–38.7x)\n- Concordance with known sites: 99.4%\n\n## Notes\nTwo samples flagged for contamination (VerifyBamID freemix > 0.03). Excluded from downstream analysis.\n\n## Files\n- \`multiqc_report.html\` — QC summary across all samples\n- \`variant_summary.html\` — Variant statistics dashboard`,
    htmlFiles: ["multiqc_report.html", "variant_summary.html"],
  },
  {
    id: "exp-003",
    title: "Single-Cell ATAC-Seq Clustering",
    date: "2025-02-20",
    tags: ["scATAC-seq", "ArchR", "epigenomics", "clustering"],
    status: "in-progress",
    markdown: `## Objective\nIdentify cell-type-specific chromatin accessibility patterns from scATAC-seq data (PBMCs).\n\n## Methods\n- Preprocessed with CellRanger-ATAC v2.0\n- Analyzed with ArchR\n- LSI dimensionality reduction (nComponents=30)\n- Harmony batch correction\n- Clustering: Louvain (resolution=0.8)\n\n## Preliminary Results\n- **14 clusters** identified\n- Annotated 8 major cell types using gene activity scores\n- CD8+ T cells show differential accessibility at IFNG locus\n\n## TODO\n- [ ] Peak calling per cluster\n- [ ] Motif enrichment (chromVAR)\n- [ ] Integration with paired scRNA-seq\n- [ ] Trajectory analysis for T cell differentiation\n\n## Files\n- \`umap_clusters.html\` — Interactive UMAP visualization`,
    htmlFiles: ["umap_clusters.html"],
  },
  {
    id: "exp-004",
    title: "Metagenomics — Gut Microbiome 16S Analysis",
    date: "2025-03-08",
    tags: ["metagenomics", "16S", "QIIME2", "microbiome"],
    status: "complete",
    markdown: `## Objective\nCharacterize gut microbiome composition across IBD patients vs. healthy controls.\n\n## Methods\n- 16S rRNA V3-V4 amplicon sequencing\n- Processed with QIIME2 (DADA2 denoising)\n- Taxonomy: Silva 138.1 classifier\n- Diversity: Faith's PD, Shannon, Bray-Curtis\n- Differential abundance: ANCOM-BC\n\n## Results\n- **Alpha diversity** significantly lower in IBD (p = 0.003, Kruskal-Wallis)\n- **Beta diversity** clear separation on PCoA (PERMANOVA R² = 0.18, p = 0.001)\n- *Faecalibacterium prausnitzii* depleted in IBD (W = 847)\n- *Enterobacteriaceae* enriched in IBD (W = 792)\n\n## Conclusions\nResults consistent with literature. Dysbiosis signature confirmed. Proceeding with shotgun metagenomics for functional analysis.\n\n## Files\n- \`alpha_diversity.html\` — Diversity boxplots\n- \`beta_diversity_pcoa.html\` — Interactive PCoA\n- \`taxonomy_barplot.html\` — Taxonomic composition`,
    htmlFiles: ["alpha_diversity.html", "beta_diversity_pcoa.html", "taxonomy_barplot.html"],
  },
  {
    id: "exp-005",
    title: "Protein Structure Prediction — AlphaFold2 Batch",
    date: "2025-03-22",
    tags: ["AlphaFold2", "structural-biology", "protein"],
    status: "in-progress",
    markdown: `## Objective\nPredict structures for 12 candidate therapeutic targets identified from DE analysis.\n\n## Setup\n- AlphaFold2 (ColabFold MMseqs2)\n- 5 models per target, amber relaxation\n- pLDDT filtering > 70\n\n## Progress\n| Target | pLDDT (best) | Status |\n|--------|-------------|--------|\n| TGT_001 | 89.2 | ✅ Done |\n| TGT_002 | 72.1 | ✅ Done |\n| TGT_003 | 91.5 | ✅ Done |\n| TGT_004 | — | 🔄 Running |\n| TGT_005–012 | — | ⏳ Queued |\n\n## Notes\nTGT_003 shows interesting disordered loop (res 142–168) that may be a druggable allosteric site.\n\n## Files\n- \`alphafold_summary.html\` — Structure gallery & pLDDT plots`,
    htmlFiles: ["alphafold_summary.html"],
  },
];

// --- Markdown renderer ---
function renderMarkdown(md) {
  let html = md;
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (match, header, sep, body) => {
    const headers = header.split("|").filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join("");
    const rows = body.trim().split("\n").map(row => {
      const cells = row.split("|").filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    return `<table class="md-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Checkboxes
  html = html.replace(/^- \[x\] (.+)$/gm, '<div class="checkbox checked">✓ $1</div>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<div class="checkbox">○ $1</div>');
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<div class="list-item">$1</div>');
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<div class="list-item numbered">$1</div>');
  // Paragraphs (blank lines)
  html = html.replace(/\n\n/g, '<div class="paragraph-break"></div>');
  // Line breaks
  html = html.replace(/\n/g, "<br/>");
  return html;
}

// --- StatusBadge ---
function StatusBadge({ status }) {
  const colors = {
    complete: { bg: "#0a2e1a", color: "#34d399", border: "#166534" },
    "in-progress": { bg: "#2a1a05", color: "#fbbf24", border: "#854d0e" },
    planned: { bg: "#1a1a2e", color: "#818cf8", border: "#3730a3" },
  };
  const s = colors[status] || colors.planned;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {status}
    </span>
  );
}

// --- Tag ---
function Tag({ label }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 3, fontSize: 11,
      background: "rgba(139,92,246,0.12)", color: "#a78bfa",
      border: "1px solid rgba(139,92,246,0.2)", fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {label}
    </span>
  );
}

// --- Main App ---
export default function LabNotebook() {
  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [view, setView] = useState("timeline"); // timeline | grid
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", tags: "", markdown: "", status: "planned" });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const searchRef = useRef(null);

  // Keyboard shortcut: Cmd/Ctrl+K for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setShowNewEntry(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Collect all tags
  const allTags = [...new Set(entries.flatMap((e) => e.tags))].sort();

  // Filter and search
  const filtered = entries.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || e.title.toLowerCase().includes(q) || e.markdown.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q));
    const matchesTag = !filterTag || e.tags.includes(filterTag);
    const matchesStatus = !filterStatus || e.status === filterStatus;
    return matchesSearch && matchesTag && matchesStatus;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const selectedEntry = entries.find((e) => e.id === selectedId);

  const addEntry = () => {
    if (!newEntry.title.trim()) return;
    const entry = {
      id: `exp-${String(entries.length + 1).padStart(3, "0")}`,
      title: newEntry.title,
      date: new Date().toISOString().split("T")[0],
      tags: newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: newEntry.status,
      markdown: newEntry.markdown || "## Objective\n\n## Methods\n\n## Results\n\n## Conclusions\n",
      htmlFiles: [],
    };
    setEntries([entry, ...entries]);
    setNewEntry({ title: "", tags: "", markdown: "", status: "planned" });
    setShowNewEntry(false);
    setSelectedId(entry.id);
  };

  const deleteEntry = (id) => {
    setEntries(entries.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    setConfirmDeleteId(null);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080b10",
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      color: "#c4cad4", display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2433; border-radius: 3px; }
        ::selection { background: rgba(139,92,246,0.3); }
        .md-h2 { font-size: 20px; font-weight: 700; color: #e2e8f0; margin: 20px 0 8px; font-family: 'IBM Plex Sans', sans-serif; }
        .md-h3 { font-size: 16px; font-weight: 600; color: #c084fc; margin: 18px 0 6px; letter-spacing: 0.02em; }
        .md-h4 { font-size: 14px; font-weight: 600; color: #94a3b8; margin: 14px 0 4px; }
        .code-block { background: #0f1219; border: 1px solid #1e2433; border-radius: 6px; padding: 12px 16px; overflow-x: auto; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #a5f3fc; margin: 8px 0; }
        .inline-code { background: rgba(139,92,246,0.12); color: #c4b5fd; padding: 1px 6px; border-radius: 3px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; }
        .md-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
        .md-table th { text-align: left; padding: 8px 12px; background: #0f1219; color: #94a3b8; border-bottom: 2px solid #1e2433; font-weight: 600; }
        .md-table td { padding: 6px 12px; border-bottom: 1px solid #141924; }
        .list-item { padding: 2px 0 2px 16px; position: relative; }
        .list-item::before { content: '›'; position: absolute; left: 0; color: #7c3aed; font-weight: 700; }
        .checkbox { padding: 3px 0 3px 4px; font-size: 13px; }
        .checkbox.checked { color: #34d399; text-decoration: line-through; opacity: 0.7; }
        .paragraph-break { height: 12px; }
        .entry-card { transition: all 0.2s ease; cursor: pointer; }
        .entry-card:hover { transform: translateY(-2px); border-color: rgba(139,92,246,0.4) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .timeline-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #7c3aed; background: #080b10; position: relative; z-index: 2; flex-shrink: 0; }
        .timeline-dot.active { background: #7c3aed; box-shadow: 0 0 12px rgba(124,58,237,0.5); }
        input:focus, textarea:focus { outline: none; border-color: #7c3aed !important; box-shadow: 0 0 0 2px rgba(124,58,237,0.15); }
        .filter-btn { transition: all 0.15s ease; cursor: pointer; }
        .filter-btn:hover { background: rgba(139,92,246,0.15) !important; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .slide-in { animation: slideIn 0.25s ease forwards; }
        .delete-btn {
          opacity: 0; transition: opacity 0.15s; padding: 4px 8px; border-radius: 4px;
          border: 1px solid transparent; background: transparent; color: #64748b;
          font-size: 11px; cursor: pointer; font-family: inherit;
        }
        .entry-card:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.08); }
        .delete-confirm {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
          border-radius: 6px; margin-top: 10px; animation: fadeIn 0.15s ease;
        }
        .delete-confirm-text { font-size: 12px; color: #f87171; flex: 1; }
        .delete-confirm-yes {
          padding: 4px 12px; border-radius: 4px; border: 1px solid #dc2626;
          background: rgba(220,38,38,0.15); color: #f87171; font-size: 11px;
          font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .delete-confirm-yes:hover { background: rgba(220,38,38,0.3); }
        .delete-confirm-no {
          padding: 4px 10px; border-radius: 4px; border: 1px solid #1e2433;
          background: transparent; color: #64748b; font-size: 11px;
          cursor: pointer; font-family: inherit;
        }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "16px 28px", borderBottom: "1px solid #141924",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(8,11,16,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
            fontFamily: "'IBM Plex Mono', monospace",
          }}>λ</div>
          <div>
            <div style={{
              fontSize: 17, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em",
              fontFamily: "'Playfair Display', serif",
            }}>Lab Notebook</div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.04em" }}>
              BIOINFORMATICS RESEARCH LOG
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#0f1219", border: "1px solid #1e2433", borderRadius: 8,
          padding: "8px 14px", width: 360,
        }}>
          <span style={{ color: "#475569", fontSize: 14 }}>⌕</span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search experiments, methods, results… (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", color: "#c4cad4",
              fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          />
          {searchQuery && (
            <span
              onClick={() => setSearchQuery("")}
              style={{ color: "#64748b", cursor: "pointer", fontSize: 12 }}
            >✕</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setView(view === "timeline" ? "grid" : "timeline")}
            className="filter-btn"
            style={{
              padding: "7px 14px", borderRadius: 6, border: "1px solid #1e2433",
              background: "#0f1219", color: "#94a3b8", fontSize: 12, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {view === "timeline" ? "◫ Grid" : "☰ Timeline"}
          </button>
          <button
            onClick={() => setShowNewEntry(true)}
            style={{
              padding: "7px 16px", borderRadius: 6, border: "none",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
            }}
          >
            + New Entry
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar - Filters */}
        <aside style={{
          width: sidebarCollapsed ? 48 : 220, borderRight: "1px solid #141924",
          padding: sidebarCollapsed ? "16px 8px" : "16px 14px", transition: "width 0.2s ease",
          overflowY: "auto", flexShrink: 0, background: "#090c12",
        }}>
          <div
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ cursor: "pointer", color: "#475569", fontSize: 12, marginBottom: 16, textAlign: sidebarCollapsed ? "center" : "right" }}
          >
            {sidebarCollapsed ? "▸" : "◂"}
          </div>

          {!sidebarCollapsed && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
                Status
              </div>
              {["complete", "in-progress", "planned"].map((s) => (
                <div
                  key={s}
                  className="filter-btn"
                  onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                  style={{
                    padding: "5px 8px", borderRadius: 4, marginBottom: 3, fontSize: 12,
                    background: filterStatus === s ? "rgba(139,92,246,0.15)" : "transparent",
                    color: filterStatus === s ? "#c4b5fd" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </div>
              ))}

              <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", margin: "20px 0 10px", textTransform: "uppercase" }}>
                Tags
              </div>
              {allTags.map((t) => (
                <div
                  key={t}
                  className="filter-btn"
                  onClick={() => setFilterTag(filterTag === t ? null : t)}
                  style={{
                    padding: "4px 8px", borderRadius: 4, marginBottom: 2, fontSize: 11,
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: filterTag === t ? "rgba(139,92,246,0.15)" : "transparent",
                    color: filterTag === t ? "#c4b5fd" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </div>
              ))}

              <div style={{
                marginTop: 32, padding: 12, background: "#0f1219", borderRadius: 8,
                border: "1px solid #1e2433", fontSize: 11, color: "#475569",
              }}>
                <div style={{ fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Stats</div>
                <div>{entries.length} experiments</div>
                <div>{entries.filter((e) => e.status === "complete").length} complete</div>
                <div>{entries.filter((e) => e.status === "in-progress").length} in progress</div>
                <div style={{ marginTop: 8, padding: "6px 0", borderTop: "1px solid #1e2433", color: "#7c3aed", fontWeight: 500 }}>
                  🤖 LLM Integration — Soon
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {/* Active filters */}
          {(filterTag || filterStatus || searchQuery) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>Showing:</span>
              {searchQuery && (
                <span style={{
                  padding: "3px 10px", borderRadius: 4, fontSize: 11,
                  background: "rgba(37,99,235,0.12)", color: "#60a5fa",
                  border: "1px solid rgba(37,99,235,0.2)",
                }}>
                  search: "{searchQuery}"
                  <span onClick={() => setSearchQuery("")} style={{ marginLeft: 6, cursor: "pointer" }}>✕</span>
                </span>
              )}
              {filterTag && (
                <span style={{
                  padding: "3px 10px", borderRadius: 4, fontSize: 11,
                  background: "rgba(139,92,246,0.12)", color: "#a78bfa",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}>
                  tag: {filterTag}
                  <span onClick={() => setFilterTag(null)} style={{ marginLeft: 6, cursor: "pointer" }}>✕</span>
                </span>
              )}
              {filterStatus && (
                <span style={{
                  padding: "3px 10px", borderRadius: 4, fontSize: 11,
                  background: "rgba(52,211,153,0.12)", color: "#34d399",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}>
                  status: {filterStatus}
                  <span onClick={() => setFilterStatus(null)} style={{ marginLeft: 6, cursor: "pointer" }}>✕</span>
                </span>
              )}
              <span
                onClick={() => { setSearchQuery(""); setFilterTag(null); setFilterStatus(null); }}
                style={{ fontSize: 11, color: "#7c3aed", cursor: "pointer" }}
              >
                Clear all
              </span>
            </div>
          )}

          <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>
            {filtered.length} experiment{filtered.length !== 1 ? "s" : ""}
          </div>

          {/* Timeline View */}
          {view === "timeline" ? (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              {/* Timeline line */}
              <div style={{
                position: "absolute", left: 5, top: 6, bottom: 0,
                width: 2, background: "linear-gradient(to bottom, #7c3aed, #1e2433, transparent)",
              }} />

              {filtered.map((entry, i) => (
                <div
                  key={entry.id}
                  className="fade-in"
                  style={{ display: "flex", gap: 20, marginBottom: 24, position: "relative", animationDelay: `${i * 0.05}s` }}
                >
                  <div className={`timeline-dot ${selectedId === entry.id ? "active" : ""}`}
                    style={{ marginTop: 18, marginLeft: -23 }} />

                  <div
                    className="entry-card"
                    onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                    style={{
                      flex: 1, padding: "16px 20px", borderRadius: 10,
                      background: selectedId === entry.id ? "#0f1219" : "#0b0f16",
                      border: `1px solid ${selectedId === entry.id ? "rgba(124,58,237,0.4)" : "#141924"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
                          {entry.id} — {entry.date}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>
                          {entry.title}
                        </div>
                      </div>
                      <StatusBadge status={entry.status} />
                      <button
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === entry.id ? null : entry.id); }}
                      >
                        🗑
                      </button>
                    </div>

                    {confirmDeleteId === entry.id && (
                      <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                        <span className="delete-confirm-text">Delete this entry? This can't be undone.</span>
                        <button className="delete-confirm-yes" onClick={() => deleteEntry(entry.id)}>Delete</button>
                        <button className="delete-confirm-no" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {entry.tags.map((t) => <Tag key={t} label={t} />)}
                    </div>

                    {entry.htmlFiles.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {entry.htmlFiles.map((f) => (
                          <span key={f} style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 3,
                            background: "rgba(37,99,235,0.1)", color: "#60a5fa",
                            border: "1px solid rgba(37,99,235,0.15)",
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}>
                            📄 {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded content */}
                    {selectedId === entry.id && (
                      <div className="slide-in" style={{
                        marginTop: 16, paddingTop: 16, borderTop: "1px solid #1e2433",
                        fontSize: 13, lineHeight: 1.7,
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.markdown) }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Grid View */
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}>
              {filtered.map((entry, i) => (
                <div
                  key={entry.id}
                  className="entry-card fade-in"
                  onClick={() => setSelectedId(entry.id)}
                  style={{
                    padding: "18px 20px", borderRadius: 10,
                    background: "#0b0f16", border: "1px solid #141924",
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {entry.id}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusBadge status={entry.status} />
                      <button
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === entry.id ? null : entry.id); }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  {confirmDeleteId === entry.id && (
                    <div className="delete-confirm" onClick={(e) => e.stopPropagation()} style={{ marginBottom: 8 }}>
                      <span className="delete-confirm-text">Delete this entry?</span>
                      <button className="delete-confirm-yes" onClick={() => deleteEntry(entry.id)}>Delete</button>
                      <button className="delete-confirm-no" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>
                    {entry.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {entry.date}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {entry.tags.map((t) => <Tag key={t} label={t} />)}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                    {entry.markdown.substring(0, 120).replace(/[#*`]/g, "")}…
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Detail panel (grid view) */}
        {view === "grid" && selectedEntry && (
          <aside className="slide-in" style={{
            width: 440, borderLeft: "1px solid #141924", overflowY: "auto",
            padding: "24px", background: "#090c12", flexShrink: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
                  {selectedEntry.id} — {selectedEntry.date}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>
                  {selectedEntry.title}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="delete-btn"
                  style={{ opacity: 1 }}
                  onClick={() => setConfirmDeleteId(confirmDeleteId === selectedEntry.id ? null : selectedEntry.id)}
                >
                  🗑 Delete
                </button>
                <span
                  onClick={() => setSelectedId(null)}
                  style={{ color: "#475569", cursor: "pointer", fontSize: 16, padding: 4 }}
                >✕</span>
              </div>
            </div>

            {confirmDeleteId === selectedEntry.id && (
              <div className="delete-confirm" style={{ marginBottom: 12 }}>
                <span className="delete-confirm-text">Delete this entry? This can't be undone.</span>
                <button className="delete-confirm-yes" onClick={() => deleteEntry(selectedEntry.id)}>Delete</button>
                <button className="delete-confirm-no" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <StatusBadge status={selectedEntry.status} />
              {selectedEntry.tags.map((t) => <Tag key={t} label={t} />)}
            </div>

            {selectedEntry.htmlFiles.length > 0 && (
              <div style={{
                padding: 12, background: "#0f1219", borderRadius: 8,
                border: "1px solid #1e2433", marginBottom: 16,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
                  Analysis Files
                </div>
                {selectedEntry.htmlFiles.map((f) => (
                  <div key={f} style={{
                    padding: "6px 10px", borderRadius: 4, marginBottom: 4,
                    background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.12)",
                    fontSize: 12, color: "#60a5fa", fontFamily: "'IBM Plex Mono', monospace",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span>📄</span> {f} <span style={{ marginLeft: "auto", fontSize: 10, color: "#475569" }}>→ Open</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedEntry.markdown) }} />
            </div>
          </aside>
        )}
      </div>

      {/* New Entry Modal */}
      {showNewEntry && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, backdropFilter: "blur(4px)",
        }}
          onClick={(e) => e.target === e.currentTarget && setShowNewEntry(false)}
        >
          <div className="fade-in" style={{
            width: 560, background: "#0b0f16", borderRadius: 14,
            border: "1px solid #1e2433", padding: "28px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 20, fontFamily: "'Playfair Display', serif" }}>
              New Experiment Entry
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>TITLE</label>
              <input
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="e.g., ChIP-Seq Peak Calling Analysis"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 6,
                  background: "#0f1219", border: "1px solid #1e2433",
                  color: "#c4cad4", fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>TAGS (comma-separated)</label>
              <input
                value={newEntry.tags}
                onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                placeholder="e.g., ChIP-Seq, MACS2, epigenomics"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 6,
                  background: "#0f1219", border: "1px solid #1e2433",
                  color: "#c4cad4", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>STATUS</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["planned", "in-progress", "complete"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewEntry({ ...newEntry, status: s })}
                      style={{
                        flex: 1, padding: "7px", borderRadius: 5, fontSize: 11,
                        border: `1px solid ${newEntry.status === s ? "#7c3aed" : "#1e2433"}`,
                        background: newEntry.status === s ? "rgba(124,58,237,0.15)" : "#0f1219",
                        color: newEntry.status === s ? "#c4b5fd" : "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                NOTES (Markdown)
              </label>
              <textarea
                value={newEntry.markdown}
                onChange={(e) => setNewEntry({ ...newEntry, markdown: e.target.value })}
                placeholder={"## Objective\n\n## Methods\n\n## Results\n\n## Conclusions"}
                rows={10}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 6,
                  background: "#0f1219", border: "1px solid #1e2433",
                  color: "#c4cad4", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
                  lineHeight: 1.6, resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowNewEntry(false)}
                style={{
                  padding: "9px 20px", borderRadius: 6, border: "1px solid #1e2433",
                  background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                style={{
                  padding: "9px 24px", borderRadius: 6, border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
                }}
              >
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
