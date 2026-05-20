// src/app/provider.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { UserDetailContext, UserDetail } from "@/context/UserDetailContext";

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);

  // Synchronize and update current state profile parameters
  const syncAndFetchUser = useCallback(async () => {
    try {
      const response = await axios.post("/api/user");
      if (response.data?.user) {
        setUserDetail(response.data.user);
      }
    } catch (error) {
      console.error("Unable to finalize local system profile sync:", error);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncAndFetchUser();
    } else if (isLoaded && !isSignedIn) {
      setUserDetail(null); // Reset client details when signed out
    }
  }, [isLoaded, isSignedIn, syncAndFetchUser]);

  return (
    <UserDetailContext.Provider
      value={{
        userDetail,
        setUserDetail,
        refreshUserContext: syncAndFetchUser,
      }}
    >
      {children}
    </UserDetailContext.Provider>
  );
}
