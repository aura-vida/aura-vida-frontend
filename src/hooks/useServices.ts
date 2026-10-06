import { useEffect, useState } from "react";
import { listServices, type Service } from "@/lib/servicesApi";

export const useServices = (limit = 100) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listServices({ limit })
      .then((res) => {
        if (!cancelled) setServices(res.services ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load services");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { services, loading, error };
};
