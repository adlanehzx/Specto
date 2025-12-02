"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProjectsAPI } from "@/services/projects.api";
import { useAuth } from "@/contexts/AuthContext";
import { InviteMemberDto, ProjectRole } from "@/types/project";
import { toast } from "react-toastify";

interface ProjectInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onInviteSuccess: () => void;
}

export function ProjectInviteModal({
  isOpen,
  onClose,
  projectId,
  onInviteSuccess,
}: ProjectInviteModalProps) {
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<ProjectRole, "owner">>("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    {
      value: "admin",
      label: "Administrateur - Peut inviter et gérer les membres",
    },
    { value: "editor", label: "Éditeur - Peut modifier les tests" },
    { value: "viewer", label: "Lecteur - Lecture seule" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("L'email est requis");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email invalide");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: InviteMemberDto = {
        email: email.trim(),
        role,
      };

      await ProjectsAPI.inviteMember(projectId, data, token!);

      toast.success(`Invitation envoyée à ${email}`);
      onInviteSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'invitation");
      toast.error(err.message || "Erreur lors de l'invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("editor");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Inviter un membre">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Email du membre"
          type="email"
          placeholder="membre@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />

        <Select
          label="Rôle"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as Exclude<ProjectRole, "owner">)
          }
          options={roleOptions}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Note :</strong> Le membre recevra un email d'invitation
            et une notification dans l'application.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Envoi..." : "Envoyer l'invitation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
