import { useState, useEffect, useRef } from "react";

const getApiKey = () => { try { return localStorage.getItem("lab-notebook-api-key") || ""; } catch { return ""; } };
const setApiKeyStorage = (key) => { try { localStorage.setItem("lab-notebook-api-key", key); } catch {} };

const SAMPLE_ENTRIES = [
  { id: "exp-001", title: "RNA-Seq Differential Expression Analysis", date: "2025-01-15", tags: ["RNA-Seq", "DESeq2", "transcriptomics"], status: "complete", markdown: "## Objective\nCompare gene expression between treatment and control groups using DESeq2 pipeline.\n\n## Methods\n- Trimmed reads with Trimmomatic (LEADING:3 TRAILING:3 SLIDINGWINDOW:4:15)\n- Aligned to GRCh38 with STAR v2.7.10\n- Quantified with featureCounts\n- Differential expression with DESeq2 (padj < 0.05, |log2FC| > 1)\n\n## Key Results\n- **2,341** genes differentially expressed\n- **1,102** upregulated, **1,239** downregulated\n- Top pathway: *TNF signaling via NF-kB* (FDR = 2.3e-12)\n\n## Conclusions\nStrong inflammatory signature in treatment group. Follow up with GSEA and network analysis.", htmlFiles: [], htmlFileData: {}, images: [] },
  { id: "exp-002", title: "Variant Calling Pipeline - WGS Cohort", date: "2025-02-03", tags: ["WGS", "GATK", "variant-calling", "genomics"], status: "complete", markdown: "## Objective\nCall germline variants across 48-sample WGS cohort using GATK best practices.\n\n## Pipeline\n1. BWA-MEM2 alignment to GRCh38\n2. MarkDuplicates (Picard)\n3. Base Quality Score Recalibration\n4. HaplotypeCaller (GVCF mode)\n5. GenomicsDBImport then GenotypeGVCFs\n6. VQSR filtering (SNPs + Indels)\n\n## Results\n- **4.2M** SNVs passed filters (Ti/Tv = 2.07)\n- **812K** indels passed filters\n- Mean coverage: 32.4x (range: 28.1-38.7x)\n- Concordance with known sites: 99.4%\n\n## Notes\nTwo samples flagged for contamination (VerifyBamID freemix > 0.03). Excluded from downstream analysis.", htmlFiles: [], htmlFileData: {}, images: [] },
  { id: "exp-003", title: "Single-Cell ATAC-Seq Clustering", date: "2025-02-20", tags: ["scATAC-seq", "ArchR", "epigenomics", "clustering"], status: "in-progress", markdown: "## Objective\nIdentify cell-type-specific chromatin accessibility patterns from scATAC-seq data (PBMCs).\n\n## Methods\n- Preprocessed with CellRanger-ATAC v2.0\n- Analyzed with ArchR\n- LSI dimensionality reduction (nComponents=30)\n- Harmony batch correction\n- Clustering: Louvain (resolution=0.8)\n\n## Preliminary Results\n- **14 clusters** identified\n- Annotated 8 major cell types using gene activity scores\n- CD8+ T cells show differential accessibility at IFNG locus\n\n## TODO\n- [ ] Peak calling per cluster\n- [ ] Motif enrichment (chromVAR)\n- [ ] Integration with paired scRNA-seq\n- [ ] Trajectory analysis for T cell differentiation", htmlFiles: [], htmlFileData: {}, images: [] },
  { id: "exp-004", title: "Metagenomics - Gut Microbiome 16S Analysis", date: "2025-03-08", tags: ["metagenomics", "16S", "QIIME2", "microbiome"], status: "complete", markdown: "## Objective\nCharacterize gut microbiome composition across IBD patients vs. healthy controls.\n\n## Methods\n- 16S rRNA V3-V4 amplicon sequencing\n- Processed with QIIME2 (DADA2 denoising)\n- Taxonomy: Silva 138.1 classifier\n- Diversity: Faith PD, Shannon, Bray-Curtis\n- Differential abundance: ANCOM-BC\n\n## Results\n- **Alpha diversity** significantly lower in IBD (p = 0.003, Kruskal-Wallis)\n- **Beta diversity** clear separation on PCoA (PERMANOVA R2 = 0.18, p = 0.001)\n- *Faecalibacterium prausnitzii* depleted in IBD (W = 847)\n- *Enterobacteriaceae* enriched in IBD (W = 792)\n\n## Conclusions\nResults consistent with literature. Dysbiosis signature confirmed.", htmlFiles: [], htmlFileData: {}, images: [] },
  { id: "exp-005", title: "Protein Structure Prediction - AlphaFold2 Batch", date: "2025-03-22", tags: ["AlphaFold2", "structural-biology", "protein"], status: "in-progress", markdown: "## Objective\nPredict structures for 12 candidate therapeutic targets identified from DE analysis.\n\n## Setup\n- AlphaFold2 (ColabFold MMseqs2)\n- 5 models per target, amber relaxation\n- pLDDT filtering > 70\n\n## Progress\n| Target | pLDDT (best) | Status |\n|--------|-------------|--------|\n| TGT_001 | 89.2 | Done |\n| TGT_002 | 72.1 | Done |\n| TGT_003 | 91.5 | Done |\n| TGT_004 | - | Running |\n| TGT_005-012 | - | Queued |\n\n## Notes\nTGT_003 shows interesting disordered loop (res 142-168) that may be a druggable allosteric site.", htmlFiles: [], htmlFileData: {}, images: [] },
];

function renderMarkdown(md, images) {
  let h = md;
  h = h.replace(/!\[([^\]]*)\]\(img-(\d+)\)/g, function(m, alt, idx) {
    var img = images && images[parseInt(idx)];
    if (img) return '<img src="' + img + '" alt="' + alt + '" style="max-width:100%;border-radius:6px;margin:8px 0;border:1px solid #1e2433;" />';
    return m;
  });
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>');
  h = h.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  h = h.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, function(match, header, sep, body) {
    var ths = header.split("|").filter(function(c){return c.trim()}).map(function(c){return "<th>"+c.trim()+"</th>"}).join("");
    var rows = body.trim().split("\n").map(function(row) {
      var tds = row.split("|").filter(function(c){return c.trim()}).map(function(c){return "<td>"+c.trim()+"</td>"}).join("");
      return "<tr>"+tds+"</tr>";
    }).join("");
    return '<table class="md-table"><thead><tr>'+ths+'</tr></thead><tbody>'+rows+'</tbody></table>';
  });
  h = h.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
  h = h.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  h = h.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*(.+?)\*/g, "<em>$1</em>");
  h = h.replace(/^- \[x\] (.+)$/gm, '<div class="checkbox checked">✓ $1</div>');
  h = h.replace(/^- \[ \] (.+)$/gm, '<div class="checkbox">○ $1</div>');
  h = h.replace(/^- (.+)$/gm, '<div class="list-item">$1</div>');
  h = h.replace(/^\d+\. (.+)$/gm, '<div class="list-item numbered">$1</div>');
  h = h.replace(/\n\n/g, '<div class="paragraph-break"></div>');
  h = h.replace(/\n/g, "<br/>");
  return h;
}

function extractTextFromHtml(htmlString) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(htmlString, "text/html");
  doc.querySelectorAll("script, style, noscript").forEach(function(el) { el.remove(); });
  var text = doc.body ? doc.body.textContent : "";
  return text.replace(/\s+/g, " ").trim().substring(0, 8000);
}

async function generateSummary(htmlContent, apiKey) {
  var textContent = extractTextFromHtml(htmlContent);
  if (!textContent || textContent.length < 20) throw new Error("Not enough text content in the HTML file to summarize.");
  var response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1500,
      messages: [{ role: "user", content: "You are a bioinformatics research assistant. Analyze the following content extracted from an HTML analysis report and provide a structured summary in markdown format. Use EXACTLY this format:\n\n## Objective\n[What was the analysis trying to accomplish]\n\n## Methods\n[What tools, pipelines, or approaches were used]\n\n## Results\n[Key findings, statistics, and outputs]\n\n## Summary\n[Brief synthesis of the most important takeaways]\n\nHere is the content to summarize:\n\n" + textContent }],
    }),
  });
  if (!response.ok) { var err = await response.json().catch(function(){return {}}); throw new Error((err.error && err.error.message) || "API error: " + response.status); }
  var data = await response.json();
  return (data.content && data.content[0] && data.content[0].text) || "No summary generated.";
}

function StatusBadge({ status }) {
  var colors = { complete: { bg: "#0a2e1a", color: "#34d399", border: "#166534" }, "in-progress": { bg: "#2a1a05", color: "#fbbf24", border: "#854d0e" }, planned: { bg: "#1a1a2e", color: "#818cf8", border: "#3730a3" } };
  var s = colors[status] || colors.planned;
  return (<span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: "1px solid " + s.border, textTransform: "uppercase", letterSpacing: "0.05em" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />{status}</span>);
}
function Tag({ label }) {
  return (<span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 11, background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)", fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>);
}

function TagInput({ value, onChange, allTags }) {
  var [focused, setFocused] = useState(false);
  var inputRef = useRef(null);
  var parts = value.split(",");
  var currentTyping = (parts[parts.length - 1] || "").trim().toLowerCase();
  var currentTags = value ? value.split(",").map(function(t){return t.trim()}).filter(Boolean) : [];
  var suggestions = currentTyping.length > 0 ? allTags.filter(function(t) { return t.toLowerCase().includes(currentTyping) && !currentTags.slice(0,-1).includes(t) && t.toLowerCase() !== currentTyping; }).slice(0,6) : [];
  var selectSuggestion = function(tag) { var before = parts.slice(0,-1).join(", "); onChange(before ? before + ", " + tag + ", " : tag + ", "); if(inputRef.current) inputRef.current.focus(); };
  return (
    <div style={{ position: "relative" }}>
      <input ref={inputRef} value={value} onChange={function(e){onChange(e.target.value)}} onFocus={function(){setFocused(true)}} onBlur={function(){setTimeout(function(){setFocused(false)},200)}} placeholder="e.g., ChIP-Seq, MACS2, epigenomics" style={{ width: "100%", padding: "10px 14px", borderRadius: 6, background: "#0f1219", border: "1px solid #1e2433", color: "#c4cad4", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }} />
      {focused && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#0f1219", border: "1px solid #1e2433", borderRadius: 6, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
          {suggestions.map(function(tag) { return (<div key={tag} onMouseDown={function(e){e.preventDefault();selectSuggestion(tag)}} style={{ padding: "8px 14px", fontSize: 12, color: "#a78bfa", fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", borderBottom: "1px solid #141924" }} onMouseEnter={function(e){e.target.style.background="rgba(139,92,246,0.1)"}} onMouseLeave={function(e){e.target.style.background="transparent"}}>{tag}</div>); })}
        </div>
      )}
    </div>
  );
}

function HtmlViewer({ fileName, htmlContent, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 20px", background: "#0b0f16", borderBottom: "1px solid #1e2433", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 14 }}>📄</span><span style={{ fontSize: 13, color: "#60a5fa", fontFamily: "'IBM Plex Mono', monospace" }}>{fileName}</span></div>
        <button onClick={onClose} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #1e2433", background: "#141924", color: "#c4cad4", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ Close</button>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}><iframe srcDoc={htmlContent} sandbox="allow-scripts allow-same-origin" style={{ width: "100%", height: "100%", border: "none", background: "#fff" }} title={fileName} /></div>
    </div>
  );
}

function SettingsModal({ onClose, apiKey, onSaveApiKey }) {
  var [key, setKey] = useState(apiKey);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, backdropFilter: "blur(4px)" }} onClick={function(e){if(e.target===e.currentTarget)onClose()}}>
      <div style={{ width: 480, background: "#0b0f16", borderRadius: 14, border: "1px solid #1e2433", padding: "28px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>Settings</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Configure your LLM integration for AI-powered summaries.</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>ANTHROPIC API KEY</label>
          <input type="password" value={key} onChange={function(e){setKey(e.target.value)}} placeholder="sk-ant-api03-..." style={{ width: "100%", padding: "10px 14px", borderRadius: 6, background: "#0f1219", border: "1px solid #1e2433", color: "#c4cad4", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }} />
          <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Your key is stored locally in your browser only.</div>
        </div>
        <div style={{ padding: 12, background: "rgba(139,92,246,0.06)", borderRadius: 8, border: "1px solid rgba(139,92,246,0.15)", marginBottom: 20, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          <strong style={{ color: "#c4b5fd" }}>How it works:</strong> Upload an HTML file, then click <strong style={{ color: "#c084fc" }}>✨ Summarize</strong> to generate structured notes (Objective → Methods → Results → Summary).
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 6, border: "1px solid #1e2433", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={function(){onSaveApiKey(key);onClose()}} style={{ padding: "9px 24px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(124,58,237,0.3)" }}>Save Key</button>
        </div>
      </div>
    </div>
  );
}

export default function LabNotebook() {
  var [entries, setEntries] = useState(SAMPLE_ENTRIES);
  var [selectedId, setSelectedId] = useState(null);
  var [searchQuery, setSearchQuery] = useState("");
  var [filterTag, setFilterTag] = useState(null);
  var [filterStatus, setFilterStatus] = useState(null);
  var [view, setView] = useState("timeline");
  var [showNewEntry, setShowNewEntry] = useState(false);
  var [newEntry, setNewEntry] = useState({ title: "", tags: "", markdown: "", status: "planned", htmlFiles: [], htmlFileData: {}, images: [] });
  var [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  var [confirmDeleteId, setConfirmDeleteId] = useState(null);
  var [viewingHtml, setViewingHtml] = useState(null);
  var [showSettings, setShowSettings] = useState(false);
  var [apiKey, setApiKey] = useState(getApiKey());
  var [summaryLoading, setSummaryLoading] = useState(false);
  var [summaryError, setSummaryError] = useState("");
  var searchRef = useRef(null);
  var textareaRef = useRef(null);
  var fileInputRef = useRef(null);

  var handleSaveApiKey = function(key) { setApiKey(key); setApiKeyStorage(key); };

  useEffect(function() {
    var handler = function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); if(searchRef.current) searchRef.current.focus(); }
      if (e.key === "Escape") { if (viewingHtml) setViewingHtml(null); else if (showSettings) setShowSettings(false); else if (showNewEntry) setShowNewEntry(false); else setSelectedId(null); }
    };
    window.addEventListener("keydown", handler);
    return function() { window.removeEventListener("keydown", handler); };
  }, [viewingHtml, showSettings, showNewEntry]);

  var allTags = Array.from(new Set(entries.flatMap(function(e){return e.tags}))).sort();
  var filtered = entries.filter(function(e) {
    var q = searchQuery.toLowerCase();
    var matchesSearch = !q || e.title.toLowerCase().includes(q) || e.markdown.toLowerCase().includes(q) || e.tags.some(function(t){return t.toLowerCase().includes(q)});
    return matchesSearch && (!filterTag || e.tags.includes(filterTag)) && (!filterStatus || e.status === filterStatus);
  }).sort(function(a,b){return new Date(b.date) - new Date(a.date)});
  var selectedEntry = entries.find(function(e){return e.id === selectedId});

  var addEntry = function() {
    if (!newEntry.title.trim()) return;
    var entry = { id: "exp-" + String(entries.length + 1).padStart(3, "0"), title: newEntry.title, date: new Date().toISOString().split("T")[0], tags: newEntry.tags.split(",").map(function(t){return t.trim()}).filter(Boolean), status: newEntry.status, markdown: newEntry.markdown || "## Objective\n\n## Methods\n\n## Results\n\n## Summary\n", htmlFiles: newEntry.htmlFiles || [], htmlFileData: newEntry.htmlFileData || {}, images: newEntry.images || [] };
    setEntries([entry].concat(entries));
    setNewEntry({ title: "", tags: "", markdown: "", status: "planned", htmlFiles: [], htmlFileData: {}, images: [] });
    setShowNewEntry(false); setSelectedId(entry.id);
  };
  var deleteEntry = function(id) { setEntries(entries.filter(function(e){return e.id !== id})); if (selectedId === id) setSelectedId(null); setConfirmDeleteId(null); };

  var handleHtmlUpload = function(e) {
    Array.from(e.target.files).forEach(function(file) {
      if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) return;
      var reader = new FileReader();
      reader.onload = function(ev) { setNewEntry(function(prev) { return { ...prev, htmlFiles: prev.htmlFiles.concat([file.name]), htmlFileData: { ...prev.htmlFileData, [file.name]: ev.target.result } }; }); };
      reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  var handlePaste = function(e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        var file = items[i].getAsFile();
        var reader = new FileReader();
        reader.onload = function(ev) {
          var dataUrl = ev.target.result;
          setNewEntry(function(prev) {
            var imgIndex = prev.images.length;
            var imgTag = "![pasted image](img-" + imgIndex + ")";
            var ta = textareaRef.current;
            var nm = prev.markdown;
            if (ta) { nm = prev.markdown.substring(0, ta.selectionStart) + imgTag + prev.markdown.substring(ta.selectionEnd); }
            else { nm = prev.markdown + "\n" + imgTag; }
            return { ...prev, images: prev.images.concat([dataUrl]), markdown: nm };
          });
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  var handleSummarize = async function(fileName) {
    if (!apiKey) { setSummaryError("Please set your API key in Settings first."); return; }
    var htmlContent = newEntry.htmlFileData[fileName];
    if (!htmlContent) { setSummaryError("No content found for this file."); return; }
    setSummaryLoading(true); setSummaryError("");
    try {
      var summary = await generateSummary(htmlContent, apiKey);
      setNewEntry(function(prev) { return { ...prev, markdown: summary + (prev.markdown ? "\n\n---\n*Previous notes:*\n" + prev.markdown : "") }; });
    } catch (err) { setSummaryError(err.message || "Failed to generate summary."); }
    finally { setSummaryLoading(false); }
  };

  var openHtmlFile = function(entry, fileName) { var content = entry.htmlFileData && entry.htmlFileData[fileName]; if (content) setViewingHtml({ fileName: fileName, content: content }); };

  var CSS = '@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap");*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e2433;border-radius:3px}::selection{background:rgba(139,92,246,0.3)}.md-h2{font-size:20px;font-weight:700;color:#e2e8f0;margin:20px 0 8px;font-family:"IBM Plex Sans",sans-serif}.md-h3{font-size:16px;font-weight:600;color:#c084fc;margin:18px 0 6px;letter-spacing:0.02em}.md-h4{font-size:14px;font-weight:600;color:#94a3b8;margin:14px 0 4px}.code-block{background:#0f1219;border:1px solid #1e2433;border-radius:6px;padding:12px 16px;overflow-x:auto;font-family:"IBM Plex Mono",monospace;font-size:12.5px;color:#a5f3fc;margin:8px 0}.inline-code{background:rgba(139,92,246,0.12);color:#c4b5fd;padding:1px 6px;border-radius:3px;font-family:"IBM Plex Mono",monospace;font-size:12.5px}.md-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}.md-table th{text-align:left;padding:8px 12px;background:#0f1219;color:#94a3b8;border-bottom:2px solid #1e2433;font-weight:600}.md-table td{padding:6px 12px;border-bottom:1px solid #141924}.list-item{padding:2px 0 2px 16px;position:relative}.list-item::before{content:"›";position:absolute;left:0;color:#7c3aed;font-weight:700}.checkbox{padding:3px 0 3px 4px;font-size:13px}.checkbox.checked{color:#34d399;text-decoration:line-through;opacity:0.7}.paragraph-break{height:12px}.entry-card{transition:all 0.2s ease;cursor:pointer}.entry-card:hover{transform:translateY(-2px);border-color:rgba(139,92,246,0.4)!important;box-shadow:0 8px 32px rgba(0,0,0,0.3)}.timeline-dot{width:12px;height:12px;border-radius:50%;border:2px solid #7c3aed;background:#080b10;position:relative;z-index:2;flex-shrink:0}.timeline-dot.active{background:#7c3aed;box-shadow:0 0 12px rgba(124,58,237,0.5)}input:focus,textarea:focus{outline:none;border-color:#7c3aed!important;box-shadow:0 0 0 2px rgba(124,58,237,0.15)}.filter-btn{transition:all 0.15s ease;cursor:pointer}.filter-btn:hover{background:rgba(139,92,246,0.15)!important}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn 0.3s ease forwards}@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}.slide-in{animation:slideIn 0.25s ease forwards}.delete-btn{opacity:0;transition:opacity 0.15s;padding:4px 8px;border-radius:4px;border:1px solid transparent;background:transparent;color:#64748b;font-size:11px;cursor:pointer;font-family:inherit}.entry-card:hover .delete-btn{opacity:1}.delete-btn:hover{color:#f87171;border-color:rgba(248,113,113,0.3);background:rgba(248,113,113,0.08)}.delete-confirm{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:6px;margin-top:10px;animation:fadeIn 0.15s ease}.delete-confirm-text{font-size:12px;color:#f87171;flex:1}.delete-confirm-yes{padding:4px 12px;border-radius:4px;border:1px solid #dc2626;background:rgba(220,38,38,0.15);color:#f87171;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}.delete-confirm-yes:hover{background:rgba(220,38,38,0.3)}.delete-confirm-no{padding:4px 10px;border-radius:4px;border:1px solid #1e2433;background:transparent;color:#64748b;font-size:11px;cursor:pointer;font-family:inherit}@keyframes spin{to{transform:rotate(360deg)}}.spinner{display:inline-block;width:14px;height:14px;border:2px solid #475569;border-top-color:#c084fc;border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle}';

  return (
    <div style={{ minHeight: "100vh", background: "#080b10", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: "#c4cad4", display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>
      {viewingHtml && <HtmlViewer fileName={viewingHtml.fileName} htmlContent={viewingHtml.content} onClose={function(){setViewingHtml(null)}} />}
      {showSettings && <SettingsModal onClose={function(){setShowSettings(false)}} apiKey={apiKey} onSaveApiKey={handleSaveApiKey} />}

      <header style={{ padding: "16px 28px", borderBottom: "1px solid #141924", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(8,11,16,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'IBM Plex Mono', monospace" }}>λ</div>
          <div><div style={{ fontSize: 17, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em", fontFamily: "'Playfair Display', serif" }}>Lab Notebook</div><div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.04em" }}>BIOINFORMATICS RESEARCH LOG</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f1219", border: "1px solid #1e2433", borderRadius: 8, padding: "8px 14px", width: 360 }}>
          <span style={{ color: "#475569", fontSize: 14 }}>⌕</span>
          <input ref={searchRef} type="text" placeholder="Search experiments… (⌘K)" value={searchQuery} onChange={function(e){setSearchQuery(e.target.value)}} style={{ flex: 1, background: "transparent", border: "none", color: "#c4cad4", fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }} />
          {searchQuery && <span onClick={function(){setSearchQuery("")}} style={{ color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={function(){setShowSettings(true)}} style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #1e2433", background: apiKey ? "rgba(52,211,153,0.08)" : "#0f1219", color: apiKey ? "#34d399" : "#94a3b8", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>{apiKey ? "🔑 API Set" : "⚙ Settings"}</button>
          <button onClick={function(){setView(view==="timeline"?"grid":"timeline")}} className="filter-btn" style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #1e2433", background: "#0f1219", color: "#94a3b8", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>{view === "timeline" ? "◫ Grid" : "☰ Timeline"}</button>
          <button onClick={function(){setNewEntry({title:"",tags:"",markdown:"",status:"planned",htmlFiles:[],htmlFileData:{},images:[]});setShowNewEntry(true);setSummaryError("")}} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(124,58,237,0.3)", fontFamily: "inherit" }}>+ New Entry</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ width: sidebarCollapsed ? 48 : 220, borderRight: "1px solid #141924", padding: sidebarCollapsed ? "16px 8px" : "16px 14px", transition: "width 0.2s ease", overflowY: "auto", flexShrink: 0, background: "#090c12" }}>
          <div onClick={function(){setSidebarCollapsed(!sidebarCollapsed)}} style={{ cursor: "pointer", color: "#475569", fontSize: 12, marginBottom: 16, textAlign: sidebarCollapsed ? "center" : "right" }}>{sidebarCollapsed ? "▸" : "◂"}</div>
          {!sidebarCollapsed && (<>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>Status</div>
            {["complete", "in-progress", "planned"].map(function(s) { return (<div key={s} className="filter-btn" onClick={function(){setFilterStatus(filterStatus===s?null:s)}} style={{ padding: "5px 8px", borderRadius: 4, marginBottom: 3, fontSize: 12, background: filterStatus===s ? "rgba(139,92,246,0.15)" : "transparent", color: filterStatus===s ? "#c4b5fd" : "#64748b", cursor: "pointer" }}>{s}</div>); })}
            <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", margin: "20px 0 10px", textTransform: "uppercase" }}>Tags</div>
            {allTags.map(function(t) { return (<div key={t} className="filter-btn" onClick={function(){setFilterTag(filterTag===t?null:t)}} style={{ padding: "4px 8px", borderRadius: 4, marginBottom: 2, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", background: filterTag===t ? "rgba(139,92,246,0.15)" : "transparent", color: filterTag===t ? "#c4b5fd" : "#64748b", cursor: "pointer" }}>{t}</div>); })}
            <div style={{ marginTop: 32, padding: 12, background: "#0f1219", borderRadius: 8, border: "1px solid #1e2433", fontSize: 11, color: "#475569" }}>
              <div style={{ fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Stats</div>
              <div>{entries.length} experiments</div>
              <div>{entries.filter(function(e){return e.status==="complete"}).length} complete</div>
              <div>{entries.filter(function(e){return e.status==="in-progress"}).length} in progress</div>
              <div style={{ marginTop: 8, padding: "6px 0", borderTop: "1px solid #1e2433", color: apiKey ? "#34d399" : "#7c3aed", fontWeight: 500 }}>🤖 LLM {apiKey ? "Connected" : "Not configured"}</div>
            </div>
          </>)}
        </aside>

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {(filterTag || filterStatus || searchQuery) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>Showing:</span>
              {searchQuery && <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11, background: "rgba(37,99,235,0.12)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.2)" }}>search: "{searchQuery}" <span onClick={function(){setSearchQuery("")}} style={{ marginLeft: 6, cursor: "pointer" }}>✕</span></span>}
              {filterTag && <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11, background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>tag: {filterTag} <span onClick={function(){setFilterTag(null)}} style={{ marginLeft: 6, cursor: "pointer" }}>✕</span></span>}
              {filterStatus && <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11, background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>status: {filterStatus} <span onClick={function(){setFilterStatus(null)}} style={{ marginLeft: 6, cursor: "pointer" }}>✕</span></span>}
              <span onClick={function(){setSearchQuery("");setFilterTag(null);setFilterStatus(null)}} style={{ fontSize: 11, color: "#7c3aed", cursor: "pointer" }}>Clear all</span>
            </div>
          )}
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>{filtered.length} experiment{filtered.length !== 1 ? "s" : ""}</div>

          {view === "timeline" ? (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 5, top: 6, bottom: 0, width: 2, background: "linear-gradient(to bottom, #7c3aed, #1e2433, transparent)" }} />
              {filtered.map(function(entry, i) { return (
                <div key={entry.id} className="fade-in" style={{ display: "flex", gap: 20, marginBottom: 24, position: "relative", animationDelay: i*0.05+"s" }}>
                  <div className={"timeline-dot"+(selectedId===entry.id?" active":"")} style={{ marginTop: 18, marginLeft: -23 }} />
                  <div className="entry-card" onClick={function(){setSelectedId(selectedId===entry.id?null:entry.id)}} style={{ flex: 1, padding: "16px 20px", borderRadius: 10, background: selectedId===entry.id ? "#0f1219" : "#0b0f16", border: "1px solid "+(selectedId===entry.id ? "rgba(124,58,237,0.4)" : "#141924") }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div><div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>{entry.id} — {entry.date}</div><div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{entry.title}</div></div>
                      <StatusBadge status={entry.status} />
                      <button className="delete-btn" onClick={function(e){e.stopPropagation();setConfirmDeleteId(confirmDeleteId===entry.id?null:entry.id)}}>🗑</button>
                    </div>
                    {confirmDeleteId===entry.id && (<div className="delete-confirm" onClick={function(e){e.stopPropagation()}}><span className="delete-confirm-text">Delete this entry?</span><button className="delete-confirm-yes" onClick={function(){deleteEntry(entry.id)}}>Delete</button><button className="delete-confirm-no" onClick={function(){setConfirmDeleteId(null)}}>Cancel</button></div>)}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{entry.tags.map(function(t){return <Tag key={t} label={t} />})}</div>
                    {entry.htmlFiles.length > 0 && (<div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>{entry.htmlFiles.map(function(f){return (<span key={f} onClick={function(e){e.stopPropagation();openHtmlFile(entry,f)}} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 3, background: (entry.htmlFileData&&entry.htmlFileData[f]) ? "rgba(37,99,235,0.1)" : "rgba(71,85,105,0.1)", color: (entry.htmlFileData&&entry.htmlFileData[f]) ? "#60a5fa" : "#475569", border: "1px solid "+((entry.htmlFileData&&entry.htmlFileData[f]) ? "rgba(37,99,235,0.15)" : "rgba(71,85,105,0.15)"), fontFamily: "'IBM Plex Mono', monospace", cursor: (entry.htmlFileData&&entry.htmlFileData[f]) ? "pointer" : "default" }}>📄 {f} {(entry.htmlFileData&&entry.htmlFileData[f]) ? "→ Open" : ""}</span>)})}</div>)}
                    {selectedId===entry.id && (<div className="slide-in" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1e2433", fontSize: 13, lineHeight: 1.7 }}><div dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.markdown, entry.images) }} /></div>)}
                  </div>
                </div>
              ); })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filtered.map(function(entry, i) { return (
                <div key={entry.id} className="entry-card fade-in" onClick={function(){setSelectedId(entry.id)}} style={{ padding: "18px 20px", borderRadius: 10, background: "#0b0f16", border: "1px solid #141924", animationDelay: i*0.04+"s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>{entry.id}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><StatusBadge status={entry.status} /><button className="delete-btn" onClick={function(e){e.stopPropagation();setConfirmDeleteId(confirmDeleteId===entry.id?null:entry.id)}}>🗑</button></div>
                  </div>
                  {confirmDeleteId===entry.id && (<div className="delete-confirm" onClick={function(e){e.stopPropagation()}} style={{ marginBottom: 8 }}><span className="delete-confirm-text">Delete?</span><button className="delete-confirm-yes" onClick={function(){deleteEntry(entry.id)}}>Delete</button><button className="delete-confirm-no" onClick={function(){setConfirmDeleteId(null)}}>Cancel</button></div>)}
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{entry.title}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{entry.date}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{entry.tags.map(function(t){return <Tag key={t} label={t} />})}</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{entry.markdown.substring(0,120).replace(/[#*`]/g,"")}…</div>
                </div>
              ); })}
            </div>
          )}
        </main>

        {view === "grid" && selectedEntry && (
          <aside className="slide-in" style={{ width: 440, borderLeft: "1px solid #141924", overflowY: "auto", padding: "24px", background: "#090c12", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div><div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>{selectedEntry.id} — {selectedEntry.date}</div><div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>{selectedEntry.title}</div></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><button className="delete-btn" style={{ opacity: 1 }} onClick={function(){setConfirmDeleteId(confirmDeleteId===selectedEntry.id?null:selectedEntry.id)}}>🗑 Delete</button><span onClick={function(){setSelectedId(null)}} style={{ color: "#475569", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</span></div>
            </div>
            {confirmDeleteId===selectedEntry.id && (<div className="delete-confirm" style={{ marginBottom: 12 }}><span className="delete-confirm-text">Delete this entry?</span><button className="delete-confirm-yes" onClick={function(){deleteEntry(selectedEntry.id)}}>Delete</button><button className="delete-confirm-no" onClick={function(){setConfirmDeleteId(null)}}>Cancel</button></div>)}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}><StatusBadge status={selectedEntry.status} />{selectedEntry.tags.map(function(t){return <Tag key={t} label={t} />})}</div>
            {selectedEntry.htmlFiles.length > 0 && (<div style={{ padding: 12, background: "#0f1219", borderRadius: 8, border: "1px solid #1e2433", marginBottom: 16 }}><div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>Analysis Files</div>{selectedEntry.htmlFiles.map(function(f){return (<div key={f} onClick={function(){openHtmlFile(selectedEntry,f)}} style={{ padding: "6px 10px", borderRadius: 4, marginBottom: 4, background: (selectedEntry.htmlFileData&&selectedEntry.htmlFileData[f]) ? "rgba(37,99,235,0.08)" : "rgba(71,85,105,0.06)", border: "1px solid "+((selectedEntry.htmlFileData&&selectedEntry.htmlFileData[f]) ? "rgba(37,99,235,0.12)" : "rgba(71,85,105,0.12)"), fontSize: 12, color: (selectedEntry.htmlFileData&&selectedEntry.htmlFileData[f]) ? "#60a5fa" : "#475569", fontFamily: "'IBM Plex Mono', monospace", cursor: (selectedEntry.htmlFileData&&selectedEntry.htmlFileData[f]) ? "pointer" : "default", display: "flex", alignItems: "center", gap: 8 }}><span>📄</span> {f} {(selectedEntry.htmlFileData&&selectedEntry.htmlFileData[f]) && <span style={{ marginLeft: "auto", fontSize: 10, color: "#475569" }}>→ Open</span>}</div>)})}</div>)}
            <div style={{ fontSize: 13, lineHeight: 1.7 }}><div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedEntry.markdown, selectedEntry.images) }} /></div>
          </aside>
        )}
      </div>

      {showNewEntry && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }} onClick={function(e){if(e.target===e.currentTarget)setShowNewEntry(false)}}>
          <div className="fade-in" style={{ width: 620, maxHeight: "90vh", overflowY: "auto", background: "#0b0f16", borderRadius: 14, border: "1px solid #1e2433", padding: "28px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 20, fontFamily: "'Playfair Display', serif" }}>New Experiment Entry</div>
            <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>TITLE</label><input value={newEntry.title} onChange={function(e){setNewEntry({...newEntry,title:e.target.value})}} placeholder="e.g., ChIP-Seq Peak Calling Analysis" style={{ width: "100%", padding: "10px 14px", borderRadius: 6, background: "#0f1219", border: "1px solid #1e2433", color: "#c4cad4", fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif" }} /></div>
            <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>TAGS (comma-separated)</label><TagInput value={newEntry.tags} onChange={function(v){setNewEntry({...newEntry,tags:v})}} allTags={allTags} /></div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}><div style={{ flex: 1 }}><label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>STATUS</label><div style={{ display: "flex", gap: 6 }}>{["planned","in-progress","complete"].map(function(s){return (<button key={s} onClick={function(){setNewEntry({...newEntry,status:s})}} style={{ flex: 1, padding: "7px", borderRadius: 5, fontSize: 11, border: "1px solid "+(newEntry.status===s?"#7c3aed":"#1e2433"), background: newEntry.status===s?"rgba(124,58,237,0.15)":"#0f1219", color: newEntry.status===s?"#c4b5fd":"#64748b", cursor: "pointer", fontFamily: "inherit" }}>{s}</button>)})}</div></div></div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>ANALYSIS FILES (.html)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input ref={fileInputRef} type="file" accept=".html,.htm" multiple onChange={handleHtmlUpload} style={{ display: "none" }} />
                <button onClick={function(){if(fileInputRef.current)fileInputRef.current.click()}} style={{ padding: "8px 16px", borderRadius: 6, border: "1px dashed #1e2433", background: "#0f1219", color: "#60a5fa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>📂 Upload HTML files</button>
                {newEntry.htmlFiles.map(function(f, idx) { return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 4, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)", fontSize: 11, color: "#60a5fa", fontFamily: "'IBM Plex Mono', monospace" }}>
                    📄 {f}
                    <button onClick={function(){handleSummarize(f)}} disabled={summaryLoading} style={{ padding: "2px 8px", borderRadius: 3, border: "1px solid rgba(192,132,252,0.3)", background: "rgba(192,132,252,0.1)", color: "#c084fc", fontSize: 10, cursor: summaryLoading?"wait":"pointer", fontFamily: "inherit", fontWeight: 600 }}>{summaryLoading ? "..." : "✨ Summarize"}</button>
                    <span onClick={function(){setNewEntry(function(prev){var nd={...prev.htmlFileData};delete nd[f];return {...prev,htmlFiles:prev.htmlFiles.filter(function(x){return x!==f}),htmlFileData:nd}})}} style={{ cursor: "pointer", color: "#475569", fontSize: 10 }}>✕</span>
                  </div>
                ); })}
              </div>
              {summaryError && <div style={{ marginTop: 6, fontSize: 11, color: "#f87171" }}>{summaryError}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>NOTES (Markdown) — <span style={{ color: "#475569", fontWeight: 400 }}>paste images with Ctrl/⌘+V</span></label>
              <textarea ref={textareaRef} value={newEntry.markdown} onChange={function(e){setNewEntry({...newEntry,markdown:e.target.value})}} onPaste={handlePaste} placeholder={"## Objective\n\n## Methods\n\n## Results\n\n## Summary"} rows={12} style={{ width: "100%", padding: "12px 14px", borderRadius: 6, background: "#0f1219", border: "1px solid #1e2433", color: "#c4cad4", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, resize: "vertical" }} />
              {newEntry.images.length > 0 && (<div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>{newEntry.images.map(function(img, idx){return (<div key={idx} style={{ position: "relative" }}><img src={img} alt={"pasted-"+idx} style={{ height: 60, borderRadius: 4, border: "1px solid #1e2433" }} /><span style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", color: "#c4cad4", fontSize: 9, padding: "1px 4px", borderRadius: 2, fontFamily: "'IBM Plex Mono', monospace" }}>img-{idx}</span></div>)})}</div>)}
            </div>

            {newEntry.markdown && (<div style={{ marginBottom: 20 }}><label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>PREVIEW</label><div style={{ padding: 16, borderRadius: 8, background: "#0a0d14", border: "1px solid #141924", fontSize: 13, lineHeight: 1.7, maxHeight: 300, overflowY: "auto" }}><div dangerouslySetInnerHTML={{ __html: renderMarkdown(newEntry.markdown, newEntry.images) }} /></div></div>)}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={function(){setShowNewEntry(false)}} style={{ padding: "9px 20px", borderRadius: 6, border: "1px solid #1e2433", background: "transparent", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={addEntry} style={{ padding: "9px 24px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(124,58,237,0.3)", fontFamily: "inherit" }}>Create Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
