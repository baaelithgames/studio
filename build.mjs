// Générateur du site statique. Lancer : node build.mjs  →  sortie dans dist/
// Aucune dépendance. Le texte est écrit directement dans le HTML (bon pour Google).
import { mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import cfg from './site.config.mjs';
import content from './content.mjs';

const OUT = 'dist';
const LANGS = ['en', 'fr'];
const PAGES = [
  { key: 'home', path: '/' },
  { key: 'bm', path: '/games/bloody-moon-first-fear/' },
  { key: 'vet', path: '/games/horror-at-the-vet/' },
  { key: 'press', path: '/press/' },
  { key: 'legal', path: '/legal/' },
];
const IMG = {
  letter: '/assets/img/nostradamus-letter.webp',
  letterFull: '/assets/img/nostradamus-letter.jpg',
  og: '/assets/img/og-bloody-moon.jpg',
};

// ---------- utilitaires ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function vars(lang) {
  return { brand: cfg.brand, legalName: cfg.legalName, email: cfg.email, demo: cfg.bloodyMoon.demo[lang], release: cfg.bloodyMoon.release[lang] };
}
// Remplace les {variables}. Version texte brut (pour les balises meta et le JSON-LD).
const plain = (s, lang) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars(lang)[k] ?? `{${k}}`);
// Version HTML : échappe, et marque les TODO en rouge.
function h(s, lang) {
  const txt = plain(s, lang);
  return txt.startsWith('TODO') ? `<span class="todo">${esc(txt)}</span>` : esc(txt);
}
const prefix = (lang) => (lang === 'fr' ? '/fr' : '');
const href = (lang, path) => prefix(lang) + path;
const abs = (lang, path) => cfg.siteUrl + href(lang, path);
const ext = (url, label, cls = '') => `<a href="${esc(url)}" target="_blank" rel="noopener" class="${cls}">${label}</a>`;

// ---------- squelette ----------
function layout({ lang, path, title, description, body, jsonld = [], ogImage = IMG.og, ogType = 'website' }) {
  const c = content[lang];
  const other = lang === 'en' ? 'fr' : 'en';
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(l, path)}">`).join('\n') +
    `\n<link rel="alternate" hreflang="x-default" href="${abs('en', path)}">`;
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  const navItem = (p, label) => `<a href="${href(lang, p)}"${p === path ? ' aria-current="page"' : ''}>${esc(label)}</a>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(plain(title, lang))}</title>
<meta name="description" content="${esc(plain(description, lang))}">
<link rel="canonical" href="${abs(lang, path)}">
${alternates}
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(cfg.brand)}">
<meta property="og:url" content="${abs(lang, path)}">
<meta property="og:title" content="${esc(plain(title, lang))}">
<meta property="og:description" content="${esc(plain(description, lang))}">
<meta property="og:image" content="${cfg.siteUrl + ogImage}">
<meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="${esc(cfg.links.xHandle)}">
<meta name="theme-color" content="#07060A">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Courier+Prime:wght@400;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
${ld}
</head>
<body>
<a class="skip" href="#main">${esc(c.common.skip)}</a>
<header class="topbar">
  <a class="logo" href="${href(lang, '/')}">${esc(cfg.brand.toUpperCase())}</a>
  <nav class="nav" aria-label="Main">
    ${navItem('/games/bloody-moon-first-fear/', c.nav.bloodyMoon)}
    ${navItem('/games/horror-at-the-vet/', c.nav.vet)}
    ${navItem('/press/', c.nav.press)}
    <a class="lang" href="${href(other, path)}" hreflang="${other}" lang="${other}">${other.toUpperCase()}</a>
  </nav>
</header>
<div class="particles" aria-hidden="true"></div>
<main id="main">
${body}
</main>
<footer class="footer">
  <p class="footer-logo">${esc(cfg.brand.toUpperCase())}</p>
  <p class="footer-links">
    ${ext(cfg.links.steam, 'Steam')} · ${ext(cfg.links.kickstarter, 'Kickstarter')} · ${ext(cfg.links.x, 'X ' + esc(cfg.links.xHandle))}
  </p>
  <p class="footer-mail"><a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></p>
  <p class="footer-copy">© ${new Date().getFullYear()} ${esc(cfg.legalName)}. ${esc(c.common.rights)} · <a href="${href(lang, '/legal/')}">${esc(c.nav.legal)}</a></p>
</footer>
<script src="/assets/main.js" defer></script>
</body>
</html>
`;
}

// ---------- blocs réutilisables ----------
const facts = (rows, lang) => `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${h(k, lang)}</dt><dd>${h(v, lang)}</dd></div>`).join('')}</dl>`;
const ctaSteam = (c) => `<div class="cta">${ext(cfg.links.steam, esc(c.common.wishlist), 'btn btn-primary')}${ext(cfg.links.kickstarter, esc(c.common.kickstarter), 'btn btn-secondary')}</div>`;

const org = () => ({
  '@type': 'Organization',
  '@id': cfg.siteUrl + '/#org',
  name: cfg.brand,
  legalName: cfg.legalName,
  url: cfg.siteUrl + '/',
  email: cfg.email,
  address: { '@type': 'PostalAddress', addressCountry: cfg.country },
  sameAs: [cfg.links.x],
});

// ---------- pages ----------
const render = {
  home(lang) {
    const c = content[lang], p = c.home;
    const body = `
<section class="hero">
  <div class="hero-content">
    <p class="eyebrow">${h(p.eyebrow, lang)}</p>
    <h1 class="hero-title">BAAELITH <span>STUDIO</span></h1>
    <p class="hero-sub">${h(p.tagline, lang)}</p>
    <p class="lead">${h(p.lead, lang)}</p>
    <div class="cta">
      <a href="#games" class="btn btn-primary">${h(p.ctaGames, lang)}</a>
      <a href="#studio" class="btn btn-secondary">${h(p.ctaStudio, lang)}</a>
    </div>
  </div>
</section>

<section class="section" id="games">
  <p class="label">${h(p.gamesLabel, lang)}</p>
  <h2 class="section-title">${h(p.gamesTitle, lang)}</h2>
  <div class="cards">
    <article class="card">
      <p class="kicker">${h(p.bmKicker, lang)}</p>
      <h3 class="card-title">Bloody Moon : First Fear</h3>
      <p class="card-sub">${h(p.bmSub, lang)}</p>
      <p>${h(p.bmDesc, lang)}</p>
      <div class="cta"><a class="btn btn-primary" href="${href(lang, '/games/bloody-moon-first-fear/')}">${h(c.common.learnMore, lang)}</a>${ext(cfg.links.steam, esc(c.common.wishlist), 'btn btn-secondary')}</div>
    </article>
    <article class="card">
      <p class="kicker">${h(p.vetKicker, lang)}</p>
      <h3 class="card-title">Horror at the Vet</h3>
      <p class="card-sub">${h(p.vetSub, lang)}</p>
      <p>${h(p.vetDesc, lang)}</p>
      <div class="cta"><a class="btn btn-secondary" href="${href(lang, '/games/horror-at-the-vet/')}">${h(c.common.learnMore, lang)}</a></div>
    </article>
    <article class="card card-dim">
      <p class="kicker">${h(p.nextKicker, lang)}</p>
      <h3 class="card-title">${h(p.nextTitle, lang)}</h3>
      <p>${h(p.nextDesc, lang)}</p>
    </article>
  </div>
</section>

<hr class="divider">

<section class="section" id="studio">
  <p class="label">${h(p.studioLabel, lang)}</p>
  <h2 class="section-title">${h(p.studioTitle, lang)}</h2>
  <div class="prose">
    <p>${h(p.studioP1, lang)}</p>
    <p>${h(p.studioP2, lang)}</p>
  </div>
  <blockquote class="manifesto">${h(p.manifesto, lang)}</blockquote>
</section>

<hr class="divider">

<section class="section center">
  <p class="label label-center">${h(p.followLabel, lang)}</p>
  <h2 class="section-title">${h(p.followTitle, lang)}</h2>
  <p class="sub">${h(p.followSub, lang)}</p>
  <div class="socials">
    ${ext(cfg.links.steam, '<span>Steam</span><small>' + esc(c.common.wishlist) + '</small>', 'social')}
    ${ext(cfg.links.kickstarter, '<span>Kickstarter</span><small>Bloody Moon</small>', 'social')}
    ${ext(cfg.links.x, '<span>X</span><small>' + esc(cfg.links.xHandle) + '</small>', 'social')}
    <a class="social" href="mailto:${esc(cfg.email)}"><span>${esc(c.common.contact)}</span><small>${esc(cfg.email)}</small></a>
  </div>
</section>`;
    const site = { '@type': 'WebSite', '@id': cfg.siteUrl + '/#site', name: cfg.brand, url: cfg.siteUrl + '/', inLanguage: LANGS, publisher: { '@id': cfg.siteUrl + '/#org' } };
    return { title: p.title, description: p.description, body, jsonld: [{ '@context': 'https://schema.org', '@graph': [org(), site] }] };
  },

  bm(lang) {
    const c = content[lang], p = c.bm;
    const body = `
<section class="hero">
  <div class="hero-content">
    <p class="eyebrow">${h(p.eyebrow, lang)}</p>
    <h1 class="hero-title">BLOODY <span>MOON</span><small>First Fear</small></h1>
    <p class="hero-sub">${h(p.tagline, lang)}</p>
    <p class="lead">${h(p.lead, lang)}</p>
    ${ctaSteam(c)}
  </div>
</section>

<section class="section split">
  <div>
    <p class="label label-red">${h(p.gameLabel, lang)}</p>
    <h2 class="section-title">${h(p.gameTitle, lang)}</h2>
    <p class="prose">${h(p.gameDesc, lang)}</p>
    <ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    ${ctaSteam(c)}
  </div>
  <figure class="parchment">
    <a href="${IMG.letterFull}"><img src="${IMG.letter}" alt="${esc(p.imgAlt)}" width="800" height="1201" loading="lazy" decoding="async"></a>
    <figcaption><span>${h(p.imgCaption, lang)}</span><span class="status">${h(p.imgStatus, lang)}</span></figcaption>
  </figure>
</section>

<hr class="divider">

<section class="section">
  <p class="label">${h(p.erasLabel, lang)}</p>
  <h2 class="section-title">${h(p.erasTitle, lang)}</h2>
  <div class="eras">
    <article class="era"><p class="era-year">1940</p><p class="kicker">${h(p.era1Kicker, lang)}</p><h3>${h(p.era1Name, lang)}</h3><p>${h(p.era1Desc, lang)}</p><span class="note">${h(p.era1Note, lang)}</span></article>
    <article class="era"><p class="era-year">1799</p><p class="kicker">${h(p.era2Kicker, lang)}</p><h3>${h(p.era2Name, lang)}</h3><p>${h(p.era2Desc, lang)}</p><span class="note">${h(p.era2Note, lang)}</span></article>
  </div>
</section>

<hr class="divider">

<section class="section">
  <p class="label">${h(p.featLabel, lang)}</p>
  <h2 class="section-title">${h(p.featTitle, lang)}</h2>
  <div class="features">
    ${p.feats.map(([t, d], i) => `<article class="feature"><p class="feature-num">${['I', 'II', 'III', 'IV'][i]}</p><h3>${h(t, lang)}</h3><p>${h(d, lang)}</p></article>`).join('\n    ')}
  </div>
</section>

<hr class="divider">

<section class="section">
  <p class="label">${h(p.factsLabel, lang)}</p>
  ${facts(p.facts, lang)}
  ${ctaSteam(c)}
</section>`;
    const game = {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: 'Bloody Moon : First Fear',
      url: abs(lang, '/games/bloody-moon-first-fear/'),
      image: cfg.siteUrl + IMG.og,
      description: plain(c.press.bmShort, lang),
      genre: ['Survival Horror', 'Horror', 'Stealth'],
      gamePlatform: 'PC',
      operatingSystem: 'Windows',
      applicationCategory: 'Game',
      playMode: 'SinglePlayer',
      inLanguage: LANGS,
      author: org(),
      publisher: { '@id': cfg.siteUrl + '/#org' },
      sameAs: [cfg.links.steam, cfg.links.kickstarter],
    };
    return { title: p.title, description: p.description, body, jsonld: [game] };
  },

  vet(lang) {
    const c = content[lang], p = c.vet;
    const body = `
<section class="hero hero-short">
  <div class="hero-content">
    <p class="eyebrow">${h(p.eyebrow, lang)}</p>
    <h1 class="hero-title">HORROR <span>AT THE VET</span></h1>
    <p class="hero-sub">${h(p.tagline, lang)}</p>
    <p class="lead">${h(p.lead, lang)}</p>
  </div>
</section>
<section class="section">
  <p class="label">${h(p.factsLabel, lang)}</p>
  ${facts(p.facts, lang)}
</section>`;
    const game = { '@context': 'https://schema.org', '@type': 'VideoGame', name: 'Horror at the Vet', url: abs(lang, '/games/horror-at-the-vet/'), author: org() };
    return { title: p.title, description: p.description, body, jsonld: [game] };
  },

  press(lang) {
    const c = content[lang], p = c.press;
    const body = `
<section class="hero hero-short">
  <div class="hero-content">
    <p class="eyebrow">${h(p.eyebrow, lang)}</p>
    <h1 class="hero-title">${h(p.h1, lang)}</h1>
    <p class="lead">${h(p.lead, lang)}</p>
    <div class="cta"><a class="btn btn-primary" href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></div>
  </div>
</section>
<section class="section">
  <p class="label">${h(p.factLabel, lang)}</p>
  ${facts(p.facts, lang)}
</section>
<hr class="divider">
<section class="section">
  <p class="label">${h(p.bmLabel, lang)}</p>
  ${facts(c.bm.facts, lang)}
  <h2 class="h3">${h(p.bmShortLabel, lang)}</h2>
  <p class="prose">${h(p.bmShort, lang)}</p>
  <h2 class="h3">${h(p.bmLongLabel, lang)}</h2>
  <p class="prose">${h(p.bmLong, lang)}</p>
</section>
<hr class="divider">
<section class="section">
  <p class="label">${h(p.assetsLabel, lang)}</p>
  <p>${h(p.assetsNote, lang)}</p>
  <div class="assets">
    <figure><img src="${IMG.letter}" alt="${esc(c.bm.imgAlt)}" width="800" height="1201" loading="lazy"><figcaption><a href="${IMG.letterFull}" download>${h(p.download, lang)} (JPG)</a></figcaption></figure>
  </div>
</section>
<hr class="divider">
<section class="section">
  <p class="label">${h(p.creatorsLabel, lang)}</p>
  <p class="prose">${h(p.creatorsText, lang)}</p>
</section>`;
    return { title: p.title, description: p.description, body };
  },

  legal(lang) {
    const p = content[lang].legal;
    const block = (label, text) => `<h2 class="h3">${h(label, lang)}</h2><p>${text}</p>`;
    const body = `
<section class="section narrow">
  <h1 class="section-title">${h(p.h1, lang)}</h1>
  ${block(p.publisherLabel, h(p.publisher, lang) + '<br>' + h(p.address, lang))}
  ${block(p.contactLabel, `<a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>`)}
  ${block(p.hostLabel, h(p.host, lang))}
  ${block(p.ipLabel, h(p.ip, lang))}
  ${block(p.privacyLabel, h(p.privacy, lang))}
  ${block(p.fictionLabel, h(p.fiction, lang))}
</section>`;
    return { title: p.title, description: p.description, body };
  },
};

// ---------- écriture ----------
function write(file, data) {
  const f = join(OUT, file);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, data);
}

rmSync(OUT, { recursive: true, force: true });
cpSync('assets', join(OUT, 'assets'), { recursive: true });

for (const lang of LANGS) {
  for (const pg of PAGES) {
    const r = render[pg.key](lang);
    write(href(lang, pg.path) + 'index.html', layout({ lang, path: pg.path, ...r }));
  }
}

// 404 (en anglais, avec lien FR)
const nf = content.en.notFound;
write('404.html', layout({
  lang: 'en', path: '/404', title: nf.title, description: nf.lead,
  body: `<section class="hero hero-short"><div class="hero-content"><h1 class="hero-title">${esc(nf.h1)}</h1><p class="lead">${esc(nf.lead)}</p><div class="cta"><a class="btn btn-primary" href="/">${esc(nf.back)}</a><a class="btn btn-secondary" href="/fr/">${esc(content.fr.notFound.back)}</a></div></div></section>`,
}).replace('<link rel="canonical"', '<meta name="robots" content="noindex">\n<link rel="canonical"'));

// sitemap avec les versions de langue
const today = new Date().toISOString().slice(0, 10);
const urls = PAGES.flatMap((pg) => LANGS.map((lang) => `  <url>
    <loc>${abs(lang, pg.path)}</loc>
    <lastmod>${today}</lastmod>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(l, pg.path)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('en', pg.path)}"/>
  </url>`)).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);

console.log(`OK : ${PAGES.length * LANGS.length} pages + 404, sitemap, robots → ${OUT}/`);
