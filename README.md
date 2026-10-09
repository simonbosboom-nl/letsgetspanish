# ¡Vamos! — SpaansTool

Een responsieve, installeerbare PWA om de Spaanse woordenschat en Frases clave van Paso Adelante 1.1–1.4 te oefenen. Inclusief quiz, typen, flashcards, woordenlijst, toetsmodus en de Homework Ninja-feedback.

## GitHub Pages

De workflow in `.github/workflows/pages.yml` publiceert de statische app naar GitHub Pages. Na de eerste push kun je de deploymentstatus bekijken onder **Actions**.

De app gebruikt geen buildstap of externe JavaScript-bibliotheken. De service worker cachet de appbestanden voor offline gebruik na de eerste online laadbeurt.
