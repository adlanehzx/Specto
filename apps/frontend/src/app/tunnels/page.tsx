/**
 * Page de gestion des tunnels Cloudflare
 */

"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import TunnelManager from "@/components/TunnelManager";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useRouter } from "next/navigation";
import { Globe2, Info } from "lucide-react";

export default function TunnelsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          {/* Page Content */}
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("tunnels.title")}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gérez vos tunnels Cloudflare actifs
                  </p>
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    {t("tunnels.quickTip")}
                  </h3>
                  <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                    <p>{t("tunnels.tipContent")}</p>
                    <p>
                      <strong>Fonctionnement automatique :</strong> Quand vous
                      créez un test avec une URL locale (ex:
                      http://localhost:3000), un tunnel est créé
                      automatiquement.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        Les URLs sont temporaires et expirent après quelques
                        heures d'inactivité
                      </li>
                      <li>
                        Les tunnels sont publics : n'importe qui avec l'URL peut
                        accéder à votre site
                      </li>
                      <li>
                        Option "Garder ouvert" disponible pour tests multiples
                        ou CI/CD
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Tunnel Manager */}
            <TunnelManager autoRefresh={5000} showTitle={true} />

            {/* Documentation section */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Documentation
              </h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Comment créer un tunnel ?
                  </h4>
                  <p>
                    Les tunnels sont créés automatiquement quand vous soumettez
                    un test avec une URL locale :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-4 mt-2">
                    <li>Allez sur le Dashboard</li>
                    <li>Entrez une URL locale (ex: http://localhost:3000)</li>
                    <li>Rédigez votre prompt de test</li>
                    <li>
                      (Optionnel) Cochez "Garder le tunnel ouvert" si besoin
                    </li>
                    <li>Cliquez sur "Lancer le test"</li>
                  </ol>
                  <p className="mt-2">
                    Le système détectera automatiquement l'URL locale et créera
                    un tunnel Cloudflare.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Quand utiliser "Garder le tunnel ouvert" ?
                  </h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Vous voulez exécuter plusieurs tests successifs</li>
                    <li>Vous testez dans un pipeline CI/CD</li>
                    <li>
                      Vous voulez partager temporairement votre site en
                      développement
                    </li>
                  </ul>
                  <p className="mt-2 text-amber-600">
                    ⚠️ N'oubliez pas de fermer les tunnels manuellement quand
                    vous avez terminé !
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Sécurité et bonnes pratiques
                  </h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      ❌ Ne jamais exposer de données sensibles (mots de passe,
                      tokens, etc.)
                    </li>
                    <li>
                      ❌ Ne pas utiliser pour des applications en production
                    </li>
                    <li>✅ Utiliser uniquement pour développement et tests</li>
                    <li>
                      ✅ Fermer les tunnels dès que vous n'en avez plus besoin
                    </li>
                    <li>✅ Surveiller les tunnels actifs régulièrement</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    URLs détectées comme locales
                  </h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        http://localhost:*
                      </code>
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        http://127.0.0.1:*
                      </code>
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        http://0.0.0.0:*
                      </code>
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        http://[::1]:*
                      </code>{" "}
                      (IPv6)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
