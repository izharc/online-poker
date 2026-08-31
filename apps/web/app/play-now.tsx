"use client";

import { useEffect, useState } from "react";

export function PlayNow() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Authentication is currently disabled.
    setAuthenticated(true);
  }, []);

  return (
    <a className="primary" href="/table">
      Play now
    </a>
  );
}