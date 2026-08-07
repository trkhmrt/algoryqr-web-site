import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function markdownToHtmlForTest(markdown: string): string {
  return markdownToHtml(markdown, { inlineStyles: true });
}

export function smartReportMarkdownToHtml(
  markdown: string,
  options?: { inlineStyles?: boolean },
): string {
  return markdownToHtml(markdown, options);
}

function markdownToHtml(
  markdown: string,
  options?: { inlineStyles?: boolean },
): string {
  const styled = options?.inlineStyles !== false;
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const parts: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      parts.push(
        styled
          ? `<h3 style="font-size:14px;margin:14px 0 6px;font-weight:700">${escapeHtml(line.slice(4))}</h3>`
          : `<h3>${escapeHtml(line.slice(4))}</h3>`,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      parts.push(
        styled
          ? `<h2 style="font-size:16px;margin:16px 0 8px;font-weight:700">${escapeHtml(line.slice(3))}</h2>`
          : `<h2>${escapeHtml(line.slice(3))}</h2>`,
      );
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      parts.push(
        styled
          ? `<h1 style="font-size:18px;margin:18px 0 10px;font-weight:700">${escapeHtml(line.slice(2))}</h1>`
          : `<h1>${escapeHtml(line.slice(2))}</h1>`,
      );
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        parts.push(styled ? '<ul style="margin:0 0 10px;padding-left:18px">' : "<ul>");
        inList = true;
      }
      parts.push(
        styled
          ? `<li style="margin:0 0 4px">${escapeHtml(line.slice(2))}</li>`
          : `<li>${escapeHtml(line.slice(2))}</li>`,
      );
      continue;
    }
    closeList();
    parts.push(
      styled
        ? `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`
        : `<p>${escapeHtml(line)}</p>`,
    );
  }
  closeList();
  return parts.join("");
}

export async function downloadSmartReportPdf(input: {
  title: string;
  markdown: string;
  fileName: string;
}): Promise<void> {
  const markdown = input.markdown?.trim() || "";
  if (!markdown && !input.title?.trim()) {
    throw new Error("PDF icin icerik bulunamadi");
  }

  const container = document.createElement("div");
  container.setAttribute("data-smart-report-pdf", "1");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "720px";
  container.style.padding = "24px";
  container.style.boxSizing = "border-box";
  container.style.color = "#111111";
  container.style.background = "#ffffff";
  container.style.fontFamily = "Segoe UI, Arial, Helvetica, sans-serif";
  container.style.fontSize = "12px";
  container.style.lineHeight = "1.5";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  container.innerHTML = `
    <h1 style="font-size:20px;margin:0 0 16px;font-weight:700;color:#111">${escapeHtml(input.title)}</h1>
    <div style="font-size:12px;color:#111">${markdownToHtml(markdown)}</div>
  `;
  document.body.appendChild(container);
  void container.offsetHeight;

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(container.scrollWidth, 720),
      windowHeight: Math.max(container.scrollHeight, 1),
      onclone: (_clonedDoc, element) => {
        element.style.opacity = "1";
        element.style.position = "static";
        element.style.left = "auto";
        element.style.top = "auto";
        element.style.zIndex = "auto";
        element.style.pointerEvents = "auto";
        element.style.transform = "none";
        element.style.visibility = "visible";
      },
    });

    if (canvas.width < 2 || canvas.height < 2) {
      throw new Error("PDF olusturulamadi: bos goruntu");
    }

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let offsetY = margin;

    doc.addImage(imgData, "PNG", margin, offsetY, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= usableHeight;

    while (heightLeft > 1) {
      offsetY = margin - (imgHeight - heightLeft);
      doc.addPage();
      doc.addImage(imgData, "PNG", margin, offsetY, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= usableHeight;
    }

    doc.save(input.fileName.endsWith(".pdf") ? input.fileName : `${input.fileName}.pdf`);
  } finally {
    container.remove();
  }
}
