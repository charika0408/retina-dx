import { ScreeningResult, Lesion } from "../types/screening";

const LESION_NAMES: Record<Lesion["type"], string> = {
  microaneurysm: "Microaneurysms",
  exudate: "Exudates",
  hemorrhage: "Hemorrhages",
};

const LESION_COLORS: Record<Lesion["type"], string> = {
  microaneurysm: "#FB7185",
  exudate: "#FBBF24",
  hemorrhage: "#EF4444",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReportHtml(result: ScreeningResult): string {
  const isLowRisk = result.risk_level === "low_risk";
  const accent = isLowRisk ? "#10B981" : "#F59E0B";
  const lesions = result.lesions ?? [];
  const date = new Date(result.created_at).toLocaleString();

  const biomarkerRows = [
    ["Microaneurysms", result.biomarkers.microaneurysms],
    ["Exudates", result.biomarkers.exudates],
    ["Hemorrhages", result.biomarkers.hemorrhages],
  ]
    .map(
      ([name, bm]: any) => `
      <tr>
        <td class="bm-name">${name}</td>
        <td class="bm-status ${bm.detected ? "flag" : "ok"}">${escapeHtml(bm.status)}</td>
        <td class="bm-details">${escapeHtml(bm.details)}</td>
      </tr>`
    )
    .join("");

  const lesionCounts = (Object.keys(LESION_NAMES) as Lesion["type"][])
    .map((type) => {
      const n = lesions.filter((l) => l.type === type).length;
      return `<div class="chip"><span class="dot" style="background:${LESION_COLORS[type]}"></span>${LESION_NAMES[type]}: <b>${n}</b></div>`;
    })
    .join("");

  const lesionMarkers = lesions
    .map((l) => {
      const size = l.radius * 2 * 100;
      return `<span class="marker" style="left:${l.x * 100}%;top:${l.y * 100}%;width:${size}%;padding-top:${size}%;background:${LESION_COLORS[l.type]};opacity:${(0.45 + l.intensity * 0.45).toFixed(2)};box-shadow:0 0 14px 6px ${LESION_COLORS[l.type]}66"></span>`;
    })
    .join("");

  const lesionList = lesions.length
    ? `<ol class="lesion-list">${lesions
        .map(
          (l) =>
            `<li><span class="dot" style="background:${LESION_COLORS[l.type]}"></span>${escapeHtml(l.label)} — position (${Math.round(l.x * 100)}%, ${Math.round(l.y * 100)}%), attention ${Math.round(l.intensity * 100)}%</li>`
        )
        .join("")}</ol>`
    : `<p class="clear">No suspicious regions were localized on this fundus image.</p>`;

  const recs = result.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("");

  const imageBlock = result.image_uri
    ? `<div class="fundus"><img src="${result.image_uri}" alt="Evaluated fundus" />${lesionMarkers}</div>`
    : `<div class="fundus placeholder">Fundus image not embedded</div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>RETINA-DX Screening Report ${escapeHtml(result.scan_id)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 28px; background: #ffffff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #00A8B5; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #0A0E17; }
  .brand small { display: block; font-size: 11px; font-weight: 600; color: #475569; letter-spacing: 0.5px; margin-top: 2px; }
  .meta { text-align: right; font-size: 11px; color: #475569; line-height: 1.6; }
  .meta b { color: #0f172a; font-family: monospace; }
  .badge { display: inline-block; padding: 10px 16px; border-radius: 10px; background: ${accent}1a; border: 2px solid ${accent}; color: ${accent}; font-weight: 900; letter-spacing: 1px; font-size: 14px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
  .cell { background: #f1f5f9; border-radius: 8px; padding: 10px; }
  .cell .label { font-size: 9px; letter-spacing: 0.8px; color: #64748b; font-weight: 700; }
  .cell .value { font-size: 14px; font-weight: 800; margin-top: 3px; color: #0f172a; }
  h2 { font-size: 12px; letter-spacing: 1px; color: #00A8B5; margin: 22px 0 8px; text-transform: uppercase; }
  .statement { font-size: 13px; line-height: 1.6; background: ${accent}12; border-left: 4px solid ${accent}; padding: 10px 12px; border-radius: 6px; }
  .grid2 { display: grid; grid-template-columns: 220px 1fr; gap: 16px; align-items: start; }
  .fundus { position: relative; width: 220px; border-radius: 12px; overflow: hidden; background: #000000; border: 1px solid #cbd5e1; }
  .fundus img { width: 100%; height: auto; display: block; }
  .fundus.placeholder { height: 220px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; }
  .marker { position: absolute; transform: translate(-50%, -50%); border-radius: 50%; border: 1.5px solid #ffffffaa; }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .chip { font-size: 11px; background: #f1f5f9; border-radius: 6px; padding: 5px 8px; display: inline-flex; align-items: center; gap: 6px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .lesion-list { font-size: 11px; line-height: 1.7; padding-left: 18px; margin: 4px 0; }
  .lesion-list li .dot { margin-right: 6px; }
  .clear { font-size: 12px; color: #059669; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .bm-name { font-weight: 700; width: 120px; }
  .bm-status { font-weight: 700; width: 150px; }
  .bm-status.flag { color: #b45309; }
  .bm-status.ok { color: #047857; }
  .bm-details { color: #475569; }
  ul.recs { font-size: 12px; line-height: 1.7; padding-left: 18px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; line-height: 1.6; }
  .footer b { color: #b91c1c; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">RETINA-DX<small>AI-POWERED RETINAL SCREENING REPORT</small></div>
    <div class="meta">Scan ID <b>${escapeHtml(result.scan_id)}</b><br/>${escapeHtml(date)}<br/>${escapeHtml(result.model_meta.architecture)}<br/>Mode: ${escapeHtml(result.model_meta.mode)} · ${escapeHtml(result.model_meta.version)}</div>
  </div>

  <span class="badge">${escapeHtml(result.risk_label)}</span>

  <div class="summary">
    <div class="cell"><div class="label">SCREENING CONFIDENCE</div><div class="value">${result.confidence.toFixed(1)}%</div></div>
    <div class="cell"><div class="label">DR CLASSIFICATION</div><div class="value">${escapeHtml(result.dr_grade.split(":")[0])}</div></div>
    <div class="cell"><div class="label">VASCULATURE INDEX</div><div class="value">${result.biomarkers.vasculature_index.toFixed(1)}%</div></div>
    <div class="cell"><div class="label">IMAGE QUALITY</div><div class="value">${result.biomarkers.quality_score}/100</div></div>
  </div>

  <h2>Screening Statement</h2>
  <div class="statement">${escapeHtml(result.message)}<br/><b>${escapeHtml(result.dr_grade)}</b> · Macular risk: ${escapeHtml(result.biomarkers.macular_risk)}</div>

  <h2>Lesion Attention Map</h2>
  <div class="grid2">
    ${imageBlock}
    <div>
      <div class="chips">${lesionCounts}</div>
      ${lesionList}
    </div>
  </div>

  <h2>Retinal Biomarkers</h2>
  <table>${biomarkerRows}</table>

  <h2>Clinical Recommendations</h2>
  <ul class="recs">${recs}</ul>

  <div class="footer">
    <b>Important:</b> ${escapeHtml(result.disclaimer)} This report is intended to support — not replace — a professional evaluation by a qualified ophthalmologist or retina specialist. Please share it with your eye-care provider.
  </div>
</body>
</html>`;
}
