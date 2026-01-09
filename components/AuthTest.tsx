"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

export default function AuthTest() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const callBackend = async () => {
      if (!user) return;

      try {
        // Get JWT from Clerk
        const token = await getToken();

        // Call Go backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth-test`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log(data);
        setMessage(JSON.stringify(data, null, 2));
      } catch (err: any) {
        setMessage("Error: " + err.message);
      }
    };

    callBackend();
  }, [user]);

  if (!user) return <p>Please sign in to test backend.</p>;

  return (
    <div>
      <h2>Auth Test Result:</h2>
      <pre>{message}</pre>
    </div>
  );
}
