# Baaelith Studio, site officiel

Site statique du studio et de ses jeux, en anglais (racine) et français (/fr/).

## Modifier le site

1. Textes : `content.mjs` (anglais et français côte à côte).
2. Domaine, email, liens, dates de sortie : `site.config.mjs`.
3. Images : `assets/img/`.

Les textes qui commencent par `TODO` s'affichent en rouge sur le site : ce sont les trous à remplir.

## Construire

```
node build.mjs
```

Le site complet sort dans `dist/` (pages, sitemap.xml, robots.txt, 404).

## Mise en ligne (Cloudflare Pages)

Connecter ce dépôt à Cloudflare Pages avec :

1. Commande de build : `node build.mjs`
2. Dossier de sortie : `dist`

Chaque modification poussée sur la branche de production remet le site à jour automatiquement.

## Règles de contenu

1. Ne jamais affirmer qu'un jeu Baaelith est vrai ou basé sur la vraie histoire (« almost everything is true », « vraie histoire », « based on true events »…). Toujours laisser planer le doute. Seule exception : la mention « œuvre de fiction » des mentions légales.
2. Horror at the Vet : aucun spoiler, pas de date ni de prix, « coming soon / bientôt ». Pas de lien Steam tant que la page n'existe pas.
3. Aucune mention de Kickstarter.
