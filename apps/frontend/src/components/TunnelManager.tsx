/**
 * TunnelManager Component
 *
 * Affiche et gère les tunnels Cloudflare depuis la base de données
 */

"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Trash2,
  Copy,
  ExternalLink,
  Activity,
  XCircle,
} from "lucide-react";

interface Tunnel {
  id: string;
  url: string;
  port: number;
  status: "active" | "closed";
  agentId: string | null;
  createdAt: string;
  closedAt: string | null;
}

interface TunnelManagerProps {
  /** Rafraîchissement automatique en millisecondes (0 = désactivé) */
  autoRefresh?: number;
  /** Afficher le titre */
  showTitle?: boolean;
  /** Callback quand un tunnel est fermé */
  onTunnelClosed?: (tunnelId: string) => void;
  /** Afficher uniquement les tunnels actifs */
  activeOnly?: boolean;
}

export default function TunnelManager({
  autoRefresh = 5000,
  showTitle = true,
  onTunnelClosed,
  activeOnly = false,
}: TunnelManagerProps) {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());

  // Récupérer les tunnels
  const fetchTunnels = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const endpoint = activeOnly
        ? "http://localhost:4000/api/tunnels/active"
        : "http://localhost:4000/api/tunnels";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des tunnels");
      }

      const data = await response.json();
      setTunnels(data.tunnels || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching tunnels:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fermer un tunnel
  const closeTunnel = async (tunnelId: string) => {
    try {
      setClosingIds((prev) => new Set(prev).add(tunnelId));

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch(
        `http://localhost:4000/api/tunnels/${tunnelId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la fermeture du tunnel"
        );
      }

      const data = await response.json();

      // Retirer le tunnel de la liste ou mettre à jour son statut
      setTunnels((prev) =>
        prev.map((t) =>
          t.id === tunnelId
            ? {
                ...t,
                status: "closed" as const,
                closedAt: new Date().toISOString(),
              }
            : t
        )
      );

      // Callback
      if (onTunnelClosed) {
        onTunnelClosed(tunnelId);
      }

      console.log(`Tunnel fermé: ${tunnelId}`);
    } catch (err: any) {
      console.error("Error closing tunnel:", err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setClosingIds((prev) => {
        const next = new Set(prev);
        next.delete(tunnelId);
        return next;
      });
    }
  };

  // Fermer tous les tunnels
  const closeAllTunnels = async () => {
    if (!confirm("Voulez-vous vraiment fermer tous les tunnels ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch("http://localhost:4000/api/tunnels", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la fermeture des tunnels");
      }

      setTunnels([]);
      console.log("Tous les tunnels ont été fermés");
    } catch (err: any) {
      console.error("Error closing all tunnels:", err);
      alert(`Erreur: ${err.message}`);
    }
  };

  // Copier l'URL dans le presse-papier
  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("URL copiée dans le presse-papier !");
    } catch (err) {
      console.error("Error copying URL:", err);
      alert("Impossible de copier l'URL");
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculer la durée
  const getDuration = (createdAt: string, closedAt: string | null) => {
    const start = new Date(createdAt);
    const end = closedAt ? new Date(closedAt) : new Date();
    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  // Rafraîchissement initial
  useEffect(() => {
    fetchTunnels();
  }, []);

  // Rafraîchissement automatique
  useEffect(() => {
    if (autoRefresh > 0) {
      const interval = setInterval(fetchTunnels, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <p className="font-semibold">Erreur</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchTunnels}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      {showTitle && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Tunnels Cloudflare
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {tunnels.length === 0
                ? "Aucun tunnel actif"
                : `${tunnels.length} tunnel${
                    tunnels.length > 1 ? "s" : ""
                  } actif${tunnels.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchTunnels}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              🔄 Rafraîchir
            </button>
            {tunnels.length > 0 && (
              <button
                onClick={closeAllTunnels}
                className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                title="Fermer tous les tunnels"
              >
                🛑 Tout fermer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tunnels list */}
      <div className="p-6">
        {tunnels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌐</div>
            <p className="text-gray-500 mb-2">
              {activeOnly ? "Aucun tunnel actif" : "Aucun tunnel"}
            </p>
            <p className="text-sm text-gray-400">
              Les tunnels sont créés automatiquement lors de tests sur localhost
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tunnels.map((tunnel) => (
              <div
                key={tunnel.id}
                className={`border rounded-lg p-4 transition-colors ${
                  tunnel.status === "active"
                    ? "border-blue-200 bg-blue-50/30 hover:border-blue-300"
                    : "border-gray-200 bg-gray-50/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Status badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Activity className="w-3 h-3 mr-1" />
                        Port {tunnel.port}
                      </span>
                      {tunnel.status === "active" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ● Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Fermé
                        </span>
                      )}
                    </div>

                    {/* URL publique */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        URL publique :
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-white px-3 py-2 rounded border border-gray-200 font-mono flex-1 truncate">
                          {tunnel.url}
                        </code>
                        <button
                          onClick={() => copyUrl(tunnel.url)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Copier l'URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {tunnel.status === "active" && (
                          <a
                            href={tunnel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors"
                            title="Ouvrir dans un nouvel onglet"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* URL locale */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1.5">
                        Serveur local :
                      </p>
                      <code className="text-sm text-gray-600 font-mono bg-white px-3 py-1 rounded border border-gray-200">
                        http://localhost:{tunnel.port}
                      </code>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Créé: {formatDate(tunnel.createdAt)}</span>
                      </div>
                      {tunnel.closedAt && (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Fermé: {formatDate(tunnel.closedAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          Durée:{" "}
                          {getDuration(tunnel.createdAt, tunnel.closedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {tunnel.status === "active" && (
                    <div className="ml-4">
                      <button
                        onClick={() => closeTunnel(tunnel.id)}
                        disabled={closingIds.has(tunnel.id)}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                          closingIds.has(tunnel.id)
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-100 hover:bg-red-200 text-red-700"
                        }`}
                      >
                        {closingIds.has(tunnel.id) ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Fermeture...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Fermer
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      {tunnels.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <span className="text-lg">💡</span>
            <div>
              <p className="font-medium mb-1">À propos des tunnels</p>
              <ul className="text-xs space-y-1 text-gray-500">
                <li>
                  • Les tunnels rendent vos serveurs locaux accessibles
                  publiquement
                </li>
                <li>
                  •{" "}
                  {activeOnly
                    ? "Affichage des tunnels actifs uniquement"
                    : `${
                        tunnels.filter((t) => t.status === "active").length
                      } actif(s), ${
                        tunnels.filter((t) => t.status === "closed").length
                      } fermé(s)`}
                </li>
                <li>
                  • ⚠️ N'exposez jamais de données sensibles via ces tunnels
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
