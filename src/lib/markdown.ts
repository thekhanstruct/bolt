function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;
  let inTable = false;
  let tableHeader: string[] = [];

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('|') && line.endsWith('|')) {
      closeList();
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
        i++;
        continue;
      }

      if (cells.every((c) => /^[-:]+$/.test(c))) {
        continue;
      }

      if (tableHeader.length > 0) {
        html.push('<table class="w-full border-collapse my-4 text-sm">');
        html.push('<thead><tr>');
        for (const h of tableHeader) {
          html.push(`<th class="border border-gray-300 px-4 py-2 text-left bg-gray-50 font-semibold">${renderInline(h)}</th>`);
        }
        html.push('</tr></thead><tbody>');
        tableHeader = [];
      }

      html.push('<tr>');
      for (const c of cells) {
        html.push(`<td class="border border-gray-300 px-4 py-2">${renderInline(c)}</td>`);
      }
      html.push('</tr>');
      continue;
    }

    if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
    }

    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3 class="text-lg font-semibold mt-5 mb-2">${renderInline(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2 class="text-xl font-bold mt-6 mb-3">${renderInline(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1 class="text-2xl font-bold mt-6 mb-3">${renderInline(line.slice(2))}</h1>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html.push('<ul class="list-disc pl-6 my-3 space-y-1">');
        inList = true;
      }
      html.push(`<li>${renderInline(line.slice(2))}</li>`);
    } else if (line.match(/^\d+\.\s/)) {
      if (!inList) {
        html.push('<ol class="list-decimal pl-6 my-3 space-y-1">');
        inList = true;
      }
      html.push(`<li>${renderInline(line.replace(/^\d+\.\s/, ''))}</li>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html.push(`<p class="my-3 leading-relaxed">${renderInline(line)}</p>`);
    }
  }

  closeList();
  if (inTable) html.push('</tbody></table>');

  return html.join('\n');
}
