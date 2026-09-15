/**
 * Exemple d'utilisation du module Cloudflare Tunnel
 *
 * Ce fichier montre comment utiliser les tunnels dans différents scénarios
 */

import {
  createCloudflareTunnel,
  closeCloudflareTunnel,
  closeAllCloudflareTunnels,
  isLocalUrl,
  resolveUrl,
  listActiveTunnels,
  createCloudflareTunnelWithRetry,
  checkCloudflareBinary,
} from "../tunnel/cloudflare";

/**
 * Exemple 1 : Créer et utiliser un tunnel simple
 */
async function example1_basicTunnel() {
  console.log("\n=== Exemple 1: Tunnel basique ===\n");

  try {
    // Créer un tunnel vers localhost:3000
    const publicUrl = await createCloudflareTunnel({
      port: 3000,
      timeout: 30000,
      verbose: true,
    });

    console.log(`✅ Tunnel créé : ${publicUrl}`);
    console.log(`Accessible publiquement pendant quelques heures`);

    // Utiliser l'URL publique pour vos tests...
    // await runTests(publicUrl);

    // Fermer le tunnel
    console.log(`\nFermeture du tunnel...`);
    closeCloudflareTunnel(3000);
  } catch (error: any) {
    console.error(`❌ Erreur:`, error.message);
  }
}

/**
 * Exemple 2 : Détecter et résoudre automatiquement les URLs
 */
async function example2_autoResolve() {
  console.log("\n=== Exemple 2: Résolution automatique ===\n");

  const urls = [
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "https://example.com",
    "https://google.com",
  ];

  for (const url of urls) {
    try {
      const result = await resolveUrl(url);

      if (result.tunnelCreated) {
        console.log(`🌐 ${url}`);
        console.log(`   → Tunnel créé: ${result.url}`);
        console.log(`   → Port: ${result.port}`);
      } else {
        console.log(`🔗 ${url}`);
        console.log(`   → URL publique directe (pas de tunnel)`);
      }
    } catch (error: any) {
      console.error(`❌ ${url} → ${error.message}`);
    }
  }
}

/**
 * Exemple 3 : Gérer plusieurs tunnels simultanés
 */
async function example3_multipleTunnels() {
  console.log("\n=== Exemple 3: Tunnels multiples ===\n");

  try {
    // Créer plusieurs tunnels
    const tunnel1 = await createCloudflareTunnel({ port: 3000 });
    const tunnel2 = await createCloudflareTunnel({ port: 8080 });
    const tunnel3 = await createCloudflareTunnel({ port: 5000 });

    console.log(`Tunnel 1 (port 3000): ${tunnel1}`);
    console.log(`Tunnel 2 (port 8080): ${tunnel2}`);
    console.log(`Tunnel 3 (port 5000): ${tunnel3}`);

    // Lister tous les tunnels actifs
    const activeTunnels = listActiveTunnels();
    console.log(`\nTunnels actifs : ${activeTunnels.size}`);

    activeTunnels.forEach((url, port) => {
      console.log(`  - Port ${port}: ${url}`);
    });

    // Fermer tous les tunnels
    console.log(`\nFermeture de tous les tunnels...`);
    closeAllCloudflareTunnels();
  } catch (error: any) {
    console.error(`❌ Erreur:`, error.message);
  }
}

/**
 * Exemple 4 : Tunnel avec retry (serveur qui démarre lentement)
 */
async function example4_tunnelWithRetry() {
  console.log("\n=== Exemple 4: Tunnel avec retry ===\n");

  try {
    // Utile si le serveur local met du temps à démarrer
    const publicUrl = await createCloudflareTunnelWithRetry(
      {
        port: 3000,
        timeout: 20000,
      },
      5, // max 5 tentatives
      3000 // 3 secondes entre tentatives
    );

    console.log(`✅ Tunnel créé après retry: ${publicUrl}`);

    closeCloudflareTunnel(3000);
  } catch (error: any) {
    console.error(`❌ Échec après toutes les tentatives:`, error.message);
  }
}

/**
 * Exemple 5 : Workflow complet de test E2E
 */
async function example5_e2eWorkflow() {
  console.log("\n=== Exemple 5: Workflow E2E complet ===\n");

  const testUrl = "http://localhost:3000";

  try {
    // 1. Vérifier si cloudflared est installé
    console.log(`1. Vérification de cloudflared...`);
    const isInstalled = await checkCloudflareBinary();

    if (!isInstalled) {
      console.error(`❌ cloudflared non installé`);
      return;
    }

    console.log(`✅ cloudflared trouvé`);

    // 2. Vérifier si l'URL est locale
    console.log(`\n2. Analyse de l'URL: ${testUrl}`);
    if (!isLocalUrl(testUrl)) {
      console.log(`URL publique détectée, pas besoin de tunnel`);
      return;
    }

    console.log(`URL locale détectée, création du tunnel...`);

    // 3. Créer le tunnel
    console.log(`\n3. Création du tunnel...`);
    const resolvedUrl = await resolveUrl(testUrl);

    console.log(`✅ URL résolue: ${resolvedUrl.url}`);

    // 4. Générer et exécuter le test (simulé)
    console.log(`\n4. Exécution des tests...`);
    console.log(`   Test 1: Page d'accueil... ✅`);
    console.log(`   Test 2: Formulaire de login... ✅`);
    console.log(`   Test 3: Navigation... ✅`);

    // 5. Fermer le tunnel
    console.log(`\n5. Nettoyage...`);
    if (resolvedUrl.port) {
      closeCloudflareTunnel(resolvedUrl.port);
      console.log(`✅ Tunnel fermé`);
    }

    console.log(`\n✨ Workflow E2E terminé avec succès !`);
  } catch (error: any) {
    console.error(`❌ Erreur dans le workflow:`, error.message);
  }
}

/**
 * Exemple 6 : Gestion d'erreurs et cleanup
 */
async function example6_errorHandling() {
  console.log("\n=== Exemple 6: Gestion d'erreurs ===\n");

  let tunnelPort: number | null = null;

  try {
    // Créer tunnel
    console.log(`Création du tunnel...`);
    const url = await createCloudflareTunnel({ port: 3000 });
    tunnelPort = 3000;

    console.log(`✅ Tunnel créé: ${url}`);

    // Simuler une erreur
    throw new Error("Erreur simulée pendant le test");
  } catch (error: any) {
    console.error(`❌ Erreur capturée: ${error.message}`);

    // Cleanup: Toujours fermer le tunnel en cas d'erreur
    if (tunnelPort) {
      console.log(`🧹 Cleanup: Fermeture du tunnel sur port ${tunnelPort}`);
      closeCloudflareTunnel(tunnelPort);
    }
  } finally {
    console.log(`✅ Cleanup terminé`);
  }
}

/**
 * Exécuter tous les exemples
 */
async function runAllExamples() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          EXEMPLES CLOUDFLARE TUNNEL - SPECTO                  ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // Vérifier d'abord si cloudflared est installé
  const isInstalled = await checkCloudflareBinary();

  if (!isInstalled) {
    console.error(`
❌ ERREUR: cloudflared n'est pas installé

Veuillez installer cloudflared avant d'exécuter ces exemples.

Voir: apps/backend/docs/CLOUDFLARE_TUNNEL.md
    `);
    return;
  }

  // Exemples à exécuter (commentez ceux que vous ne voulez pas)
  // await example1_basicTunnel();
  // await example2_autoResolve();
  // await example3_multipleTunnels();
  // await example4_tunnelWithRetry();
  await example5_e2eWorkflow();
  // await example6_errorHandling();

  console.log(`\n✨ Tous les exemples terminés !\n`);
}

// Exécuter si appelé directement
if (require.main === module) {
  runAllExamples()
    .then(() => {
      console.log(`Programme terminé`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`Erreur fatale:`, error);
      process.exit(1);
    });
}

export {
  example1_basicTunnel,
  example2_autoResolve,
  example3_multipleTunnels,
  example4_tunnelWithRetry,
  example5_e2eWorkflow,
  example6_errorHandling,
};
