export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = d - now;
  const absSec = Math.abs(diff) / 1000;
  const past = diff < 0;
  let value: number;
  let unit: string;
  if (absSec < 60) {
    return past ? "just now" : "in moments";
  } else if (absSec < 3600) {
    value = Math.round(absSec / 60);
    unit = value === 1 ? "minute" : "minutes";
  } else if (absSec < 86400) {
    value = Math.round(absSec / 3600);
    unit = value === 1 ? "hour" : "hours";
  } else if (absSec < 86400 * 30) {
    value = Math.round(absSec / 86400);
    unit = value === 1 ? "day" : "days";
  } else {
    return formatDate(iso);
  }
  return past ? `${value} ${unit} ago` : `in ${value} ${unit}`;
}

export function deadlineStatus(
  iso: string | null | undefined,
): "overdue" | "soon" | "ok" | "none" {
  if (!iso) return "none";
  const d = new Date(iso).getTime();
  const now = Date.now();
  if (d < now) return "overdue";
  if (d - now < 3 * 24 * 60 * 60 * 1000) return "soon";
  return "ok";
}
