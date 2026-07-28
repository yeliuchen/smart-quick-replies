const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const ICON_NODES = Object.freeze({
  'grip-vertical': [
    ['circle', { cx: 9, cy: 12, r: 1 }],
    ['circle', { cx: 9, cy: 5, r: 1 }],
    ['circle', { cx: 9, cy: 19, r: 1 }],
    ['circle', { cx: 15, cy: 12, r: 1 }],
    ['circle', { cx: 15, cy: 5, r: 1 }],
    ['circle', { cx: 15, cy: 19, r: 1 }],
  ],
  'refresh-cw': [
    ['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }],
    ['path', { d: 'M21 3v5h-5' }],
    ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }],
    ['path', { d: 'M8 16H3v5' }],
  ],
  'chevron-down': [['path', { d: 'm6 9 6 6 6-6' }]],
  sparkles: [
    ['path', { d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z' }],
    ['path', { d: 'M20 2v4' }],
    ['path', { d: 'M22 4h-4' }],
    ['circle', { cx: 4, cy: 20, r: 2 }],
  ],
  'map-pin-off': [
    ['path', { d: 'M12.75 7.09a3 3 0 0 1 2.16 2.16' }],
    ['path', { d: 'M17.072 17.072c-1.634 2.17-3.527 3.912-4.471 4.727a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 1.432-4.568' }],
    ['path', { d: 'm2 2 20 20' }],
    ['path', { d: 'M8.475 2.818A8 8 0 0 1 20 10c0 1.183-.31 2.377-.81 3.533' }],
    ['path', { d: 'M9.13 9.13a3 3 0 0 0 3.74 3.74' }],
  ],
  'list-restart': [
    ['path', { d: 'M21 5H3' }],
    ['path', { d: 'M7 12H3' }],
    ['path', { d: 'M7 19H3' }],
    ['path', { d: 'M12 18a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L11 14' }],
    ['path', { d: 'M11 10v4h4' }],
  ],
  'undo-2': [
    ['path', { d: 'M9 14 4 9l5-5' }],
    ['path', { d: 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11' }],
  ],
  'trash-2': [
    ['path', { d: 'M10 11v6' }],
    ['path', { d: 'M14 11v6' }],
    ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }],
    ['path', { d: 'M3 6h18' }],
    ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
  ],
});

export const createLucideIcon = (documentImpl, name, options = {}) => {
  const nodes = ICON_NODES[name];
  if (!nodes) throw new Error(`Unknown Lucide icon: ${name}`);

  const svg = documentImpl.createElementNS(SVG_NAMESPACE, 'svg');
  for (const [attribute, value] of [
    ['viewBox', '0 0 24 24'],
    ['fill', 'none'],
    ['stroke', 'currentColor'],
    ['stroke-width', 2],
    ['stroke-linecap', 'round'],
    ['stroke-linejoin', 'round'],
    ['aria-hidden', 'true'],
  ]) svg.setAttribute(attribute, value);
  svg.classList.add('lucide', `lucide-${name}`);
  if (options.className) svg.classList.add(options.className);

  for (const [tagName, attributes] of nodes) {
    const child = documentImpl.createElementNS(SVG_NAMESPACE, tagName);
    for (const [attribute, value] of Object.entries(attributes)) child.setAttribute(attribute, value);
    svg.appendChild(child);
  }
  return svg;
};

export const hydrateLucideIcons = (root, documentImpl = root.ownerDocument) => {
  let count = 0;
  for (const placeholder of root.querySelectorAll('[data-lucide]')) {
    if (!placeholder.dataset.lucide) continue;
    const icon = createLucideIcon(documentImpl, placeholder.dataset.lucide);
    placeholder.replaceChildren(icon);
    placeholder.removeAttribute('data-lucide');
    count += 1;
  }
  return count;
};
