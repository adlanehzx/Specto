# Cloudflare Tunnel Module

Module de gestion des tunnels Cloudflare pour exposer des serveurs locaux via des URLs publiques temporaires.

## 🎯 Objectif

Permettre à Specto de tester des sites web locaux (`http://localhost:*`) en créant automatiquement des tunnels Cloudflare publics sans configuration.

## 📦 Installation

### Prérequis : cloudflared

```bash
# Windows
choco install cloudflared

# macOS
brew install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

## 🚀 Utilisation

### Exemple basique

```typescript
import {
  createCloudflareTunnel,
  closeCloudflareTunnel,
} from "./tunnel/cloudflare";

// Créer un tunnel vers localhost:3000
const publicUrl = await createCloudflareTunnel({ port: 3000 });
console.log(publicUrl);
// → https://abc-def-ghi.trycloudflare.com

// Utiliser l'URL publique...
await runTests(publicUrl);

// Fermer le tunnel
closeCloudflareTunnel(3000);
```

### Résolution automatique

```typescript
import { resolveUrl } from "./tunnel/cloudflare";

// URL locale → crée tunnel automatiquement
const result1 = await resolveUrl("http://localhost:3000");
// → { url: 'https://abc.trycloudflare.com', tunnelCreated: true, port: 3000 }

// URL publique → retourne telle quelle
const result2 = await resolveUrl("https://example.com");
// → { url: 'https://example.com', tunnelCreated: false }
```

## 📚 API

### createCloudflareTunnel(config)

Crée un tunnel Cloudflare vers un port local.

**Paramètres :**

- `port` (number) - Port du serveur local
- `timeout` (number, optionnel) - Timeout en ms (défaut: 30000)
- `verbose` (boolean, optionnel) - Logs détaillés (défaut: false)

**Retour :** Promise<string> - URL publique du tunnel

```typescript
const url = await createCloudflareTunnel({
  port: 3000,
  timeout: 30000,
  verbose: true,
});
```

### closeCloudflareTunnel(port)

Ferme un tunnel actif sur un port spécifique.

**Retour :** boolean - true si fermé, false si non trouvé

```typescript
const closed = closeCloudflareTunnel(3000);
```

### closeAllCloudflareTunnels()

Ferme tous les tunnels actifs.

```typescript
closeAllCloudflareTunnels();
```

### isLocalUrl(url)

Vérifie si une URL est locale.

**Retour :** boolean

```typescript
isLocalUrl("http://localhost:3000"); // true
isLocalUrl("http://127.0.0.1:8080"); // true
isLocalUrl("https://example.com"); // false
```

### resolveUrl(url, config?)

Résout une URL : crée un tunnel si locale, retourne telle quelle sinon.

**Retour :** Promise<{ url, tunnelCreated, port?, originalUrl? }>

```typescript
const result = await resolveUrl("http://localhost:3000");
if (result.tunnelCreated) {
  console.log(`Tunnel: ${result.url}`);
  console.log(`Port: ${result.port}`);
}
```

### listActiveTunnels()

Liste tous les tunnels actifs.

**Retour :** Map<number, string> - port → URL

```typescript
const tunnels = listActiveTunnels();
tunnels.forEach((url, port) => {
  console.log(`Port ${port}: ${url}`);
});
```

### getTunnelUrl(port)

Obtient l'URL d'un tunnel actif.

**Retour :** string | null

```typescript
const url = getTunnelUrl(3000);
if (url) {
  console.log(`Tunnel actif: ${url}`);
}
```

### isTunnelActive(port)

Vérifie si un tunnel est actif sur un port.

**Retour :** boolean

```typescript
if (isTunnelActive(3000)) {
  console.log("Tunnel actif sur port 3000");
}
```

### checkCloudflareBinary()

Vérifie si cloudflared est installé.

**Retour :** Promise<boolean>

```typescript
const installed = await checkCloudflareBinary();
if (!installed) {
  printInstallationInstructions();
}
```

## 🔄 Intégration dans Specto

Le module est intégré dans :

1. **testGenerator.ts** - Résout automatiquement les URLs locales
2. **queue.ts** - Gère le cycle de vie (création → test → fermeture)
3. **routes/tunnels.ts** - API REST de gestion

### Workflow automatique

```typescript
// User crée un test avec URL locale
POST /api/tests {
  "url": "http://localhost:3000",
  "prompt": "Test homepage"
}

// Le worker :
// 1. Détecte URL locale
// 2. Crée tunnel automatiquement
// 3. Génère code avec URL publique
// 4. Exécute test
// 5. Ferme tunnel
```

## 🛡️ Sécurité

### Limitations

⚠️ Les tunnels `trycloudflare.com` sont **publics** :

- N'importe qui avec l'URL peut accéder
- URLs temporaires (quelques heures)
- Pas d'authentification

### Bonnes pratiques

1. Ne jamais exposer de données sensibles
2. Fermer les tunnels après utilisation
3. Utiliser `keepTunnelOpen: false` par défaut
4. Surveiller les tunnels actifs

## 📖 Documentation

- **Guide complet :** `docs/CLOUDFLARE_TUNNEL.md`
- **Quick start :** `docs/TUNNEL_QUICKSTART.md`
- **Exemples :** `src/examples/tunnel-examples.ts`
- **Résumé :** `docs/TUNNEL_INTEGRATION_SUMMARY.md`

## 🧪 Tests

```bash
# Exécuter les exemples
npx ts-node src/examples/tunnel-examples.ts
```

## 🐛 Troubleshooting

### "cloudflared not found"

→ Installer cloudflared (voir Installation ci-dessus)

### "Tunnel timeout"

→ Vérifier que le serveur local tourne : `curl http://localhost:PORT`

### "Port already in use"

→ Fermer le tunnel : `DELETE /api/tunnels/PORT`

## 📝 Changelog

### v1.0.0 (2025-10-31)

- ✅ Module initial
- ✅ Détection automatique URLs locales
- ✅ Création/fermeture tunnels
- ✅ Intégration testGenerator + queue
- ✅ Routes API REST
- ✅ Documentation complète
