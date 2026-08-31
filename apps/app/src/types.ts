export type RecordKind = "meal" | "water" | "weight";

export type LocalRecord = {
  id: string;
  kind: RecordKind;
  title: string;
  subtitle: string;
  amount?: number;
  unit?: string;
  energyKcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  recordedAt: string;
  source: "manual" | "sync";
  revision: number;
  syncStatus: "synced" | "pending" | "conflict";
};

export type Session = {
  mode: "demo" | "authenticated";
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresAt?: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    createdAt?: string;
    timezone?: string;
  };
};

/** Native persistence keeps only the refresh credential and identity. */
export type PersistedSession = {
  mode: "authenticated";
  refreshToken: string;
  user: Session["user"];
};

export type MutationDraft = {
  clientMutationId: string;
  deviceId: string;
  entityId: string;
  entityType: RecordKind;
  operation: "create";
  baseRevision: number;
  payload: Record<string, unknown>;
  createdAt: string;
};
