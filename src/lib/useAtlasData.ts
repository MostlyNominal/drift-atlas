import { useEffect, useState } from "react";
import { loadAtlasData } from "./data";
import type { AtlasData } from "./types";

interface AtlasDataState {
  data: AtlasData | null;
  error: string | null;
  loading: boolean;
}

export function useAtlasData(): AtlasDataState {
  const [state, setState] = useState<AtlasDataState>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    loadAtlasData()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : String(error),
            loading: false,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
