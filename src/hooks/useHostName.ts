import { useEffect, useState } from "react";

export function useHostName() {
  const [hostname, setHostname] = useState("localhost"); // default fallback for SSR

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  return hostname;
}
