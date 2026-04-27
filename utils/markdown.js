function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeHtmlEntities(text = '') {
  return String(text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function renderInlineMarkdown(text = '') {
  let html = escapeHtml(text);
  html = html.replace(/`([^`\n]+)`/g, '<code style="padding: 2px 8px; border-radius: 10rpx; background: #eef2ff; color: #3451c6; font-family: monospace;">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  return html;
}

function renderParagraph(lines = []) {
  const content = lines.join(' ').trim();
  if (!content) return '';
  return `<div style="margin-bottom: 12rpx; color: #6f6f81; font-size: 28rpx; line-height: 1.7;">${renderInlineMarkdown(content)}</div>`;
}

function renderHeading(line = '') {
  const match = line.match(/^(#{1,3})\s+(.+)$/);
  if (!match) return '';
  const level = match[1].length;
  const sizeMap = {
    1: '34rpx',
    2: '32rpx',
    3: '30rpx',
  };
  return `<div style="margin-bottom: 12rpx; color: #2a2230; font-size: ${sizeMap[level]}; font-weight: 700; line-height: 1.5;">${renderInlineMarkdown(match[2])}</div>`;
}

function renderList(items = []) {
  if (!items.length) return '';
  return items
    .map((item) => `<div style="margin-bottom: 8rpx; color: #6f6f81; font-size: 28rpx; line-height: 1.7;">• ${renderInlineMarkdown(item)}</div>`)
    .join('');
}

function renderCodeBlock(lines = [], lang = '') {
  const code = escapeHtml(lines.join('\n'));
  const label = lang ? `<div style="margin-bottom: 10rpx; color: #7b86a5; font-size: 22rpx;">${escapeHtml(lang)}</div>` : '';
  return `<div style="margin-bottom: 16rpx; padding: 18rpx 20rpx; border-radius: 18rpx; background: #f4f7fc; border: 1rpx solid #e2e8f5; overflow: hidden;">${label}<pre style="margin: 0; white-space: pre-wrap; word-break: break-word; color: #2f3a53; font-size: 24rpx; line-height: 1.7; font-family: monospace;">${code}</pre></div>`;
}

function buildMarkdownPreview(markdown = '', options = {}) {
  const source = String(markdown || '').replace(/\r\n/g, '\n').trim();
  if (!source) {
    return '<div style="color: #9fa2ad; font-size: 28rpx;">暂无内容</div>';
  }

  const maxBlocks = options.maxBlocks || 4;
  const maxCodeLines = options.maxCodeLines || 6;
  const lines = source.split('\n');
  const html = [];
  let index = 0;
  let blockCount = 0;
  let truncated = false;

  while (index < lines.length && blockCount < maxBlocks) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        if (codeLines.length < maxCodeLines) {
          codeLines.push(lines[index]);
        } else {
          truncated = true;
        }
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      html.push(renderCodeBlock(codeLines, lang));
      blockCount += 1;
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      html.push(renderHeading(line));
      index += 1;
      blockCount += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        if (items.length < 4) {
          items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        } else {
          truncated = true;
        }
        index += 1;
      }
      html.push(renderList(items));
      blockCount += 1;
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^#{1,3}\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    html.push(renderParagraph(paragraphLines));
    blockCount += 1;
  }

  if (index < lines.length || truncated) {
    html.push('<div style="margin-top: 4rpx; color: #9fa2ad; font-size: 24rpx;">...</div>');
  }

  return html.join('');
}

function extractMarkdownExcerpt(markdown = '', maxLength = 60) {
  const source = String(markdown || '').replace(/\r\n/g, '\n');
  if (!source.trim()) return '暂无内容';

  let text = source
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(div|p|pre|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```[\w-]*\n?/, '').replace(/```$/, ' '))
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  text = decodeHtmlEntities(text);
  text = text.replace(/\s+/g, ' ').trim();

  if (!text) return '暂无内容';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

module.exports = {
  buildMarkdownPreview,
  extractMarkdownExcerpt,
};
