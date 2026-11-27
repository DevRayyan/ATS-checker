// Builds the brand SVGs. The wordmark is converted to outlines so it renders
// the same everywhere (GitHub README images cannot load web fonts).
import opentype from 'opentype.js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const buf = readFileSync(new URL('./GoogleSans-700.woff', import.meta.url))
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))

const SIZE = 26
const BASE = 34.5
const TEXT_X = 45

function word(text, x) {
  const p = font.getPath(text, x, BASE, SIZE, { kerning: true })
  return { d: p.toPathData(2), width: font.getAdvanceWidth(text, SIZE, { kerning: true }) }
}

const DOC = 'M14 14 H46 L62 30 V74 H14 Z'

function mark(id, c) {
  return `<defs><clipPath id="${id}"><path d="${DOC}"/></clipPath></defs>
  <g clip-path="url(#${id})">
    <rect x="0" y="0" width="90" height="34" fill="${c.l1}"/>
    <rect x="0" y="34" width="90" height="18" fill="${c.l2}"/>
    <rect x="0" y="52" width="90" height="40" fill="${c.l3}"/>
  </g>
  <path d="${DOC}" fill="none" stroke="${c.ink}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M46 14 V30 H62" fill="none" stroke="${c.ink}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M25 44 H42" stroke="${c.ink}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.9"/>
  <path d="M25 59 H40" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none"/>
  <circle cx="62" cy="72" r="15" fill="${c.badge}" stroke="${c.ink}" stroke-width="5"/>
  <path d="M55 72 L60 77 L69 66" stroke="${c.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
}

const light = { ink: '#111827', l1: '#C9F0DE', l2: '#2FBF86', l3: '#046C4E', accent: '#059669', badge: '#FFFFFF' }
const dark = { ink: '#F9FAFB', l1: '#C9F0DE', l2: '#34D399', l3: '#059669', accent: '#34D399', badge: '#111827' }

function logo(c, id) {
  const a = word('ATS', TEXT_X)
  const b = word('Checker', TEXT_X + a.width + 7)
  const w = Math.ceil(TEXT_X + a.width + 7 + b.width + 3)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 50" width="${w * 4}" height="200" fill="none" role="img" aria-label="ATS Checker">
  <title>ATS Checker</title>
  <g transform="translate(-5 -4.3) scale(0.56)">
  ${mark(id, c)}
  </g>
  <path d="${a.d}" fill="${c.ink}"/>
  <path d="${b.d}" fill="${c.accent}"/>
</svg>
`
}

function icon(c, id, bg, border) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256" fill="none" role="img" aria-label="ATS Checker">
  <title>ATS Checker</title>
  <rect width="64" height="64" rx="14" fill="${bg}"/>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" fill="none" stroke="${border}" stroke-opacity="0.14" stroke-width="1.5"/>
  <g transform="translate(9 2.6) scale(0.56)">
  ${mark(id, c)}
  </g>
</svg>
`
}

mkdirSync(new URL('../public/brand/', import.meta.url), { recursive: true })
const out = (f, s) => writeFileSync(new URL('../public/brand/' + f, import.meta.url), s)
out('ats-checker-logo.svg', logo(light, 'a1'))
out('ats-checker-logo-light.svg', logo(dark, 'a2'))
out('ats-checker-icon.svg', icon(light, 'a3', '#FFFFFF', '#111827'))
writeFileSync(new URL('../public/favicon.svg', import.meta.url), icon(light, 'a4', '#FFFFFF', '#111827'))
console.log('logos written')
