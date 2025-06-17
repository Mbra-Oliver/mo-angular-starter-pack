# 🚀 Mbra Oliver Angular Starter Pack

Un starter pack Angular 20+ bien structuré, moderne et extensible, prêt pour les projets professionnels utilisant les signals et les dernières nouveautés d'angular.

> Généré avec [Angular CLI](https://github.com/angular/angular-cli) v20.0.0.

---

## 🗂️ Structure du projet

```
src/
├── app/
├── components/ui/        # Composants UI réutilisables (button, input, table, etc.)
├── core/                 # Fonctions critiques du projet
│   ├── guards/           # AuthGuards et route protections
│   ├── interceptors/     # Intercepteurs HTTP (auth, loader, etc.)
│   ├── interfaces/       # Types et modèles TypeScript
│   ├── resolvers/        # Route data resolvers
│   ├── utils/            # Fonctions utilitaires globales
│   └── utils-components/ # Composants utilitaires partagés
```

---

## ⚙️ Prérequis

- Node.js ≥ 18
- Angular CLI ≥ 20
- PNPM ou NPM

---

## 🧪 Lancer le serveur de développement

```bash
ng serve
```

Ouvre `http://localhost:4200/` dans ton navigateur. L’application se recharge automatiquement à chaque modification.

---

## 🧱 Génération de code

```bash
ng generate component my-component
ng generate service core/services/my-service
```

Liste complète des options :

```bash
ng generate --help
```

---

## 📦 Build du projet

```bash
ng build
```

Les artefacts de build sont générés dans le dossier `dist/`.

---

## ✅ Tests unitaires

```bash
ng test
```

---

## 🧪 Tests end-to-end

> Angular 20 ne fournit plus de framework e2e par défaut.

Tu peux ajouter :

- Cypress
- Playwright
- WebdriverIO

---

## 🌈 Fonctionnalités incluses

- ✔️ Angular 20
- ⚡ UI Components modulaires (`components/ui`)
- 🔐 Intercepteurs HTTP personnalisés (`core/interceptors`)
- 🧰 Utilitaires (`core/utils`)
- 📦 Structure scalable (suivant les best practices Angular)
- 🎨 Pré-configuré pour intégrer Tailwind CSS

---

## 💡 À venir (To Do)

- [ ] Exemple d'utilisation des composantes
- [ ] AuthService avec token JWT
- [ ] Exemple complet de formulaire dynamique
- [ ] Layout admin/public
- [ ] Configuration SSR (Angular Universal)

---

## 📚 Liens utiles

- [Documentation Angular](https://angular.dev/)
- [Angular CLI Commands](https://angular.dev/tools/cli)
- [RxJS Documentation](https://rxjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 👤 Auteur

Développé par [@Mbra-Oliver](https://github.com/Mbra-Oliver)

---

## 🪪 Licence

MIT © Mbra Oliver
