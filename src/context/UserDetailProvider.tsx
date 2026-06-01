"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext, UserDetail } from "./UserDetailContext";
import axios from "axios";

export function UserDetailProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);

  // 🛰️ Hit your existing API endpoint route directly to sync profile status
  const refreshUserContext = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.post("/api/user");
      const userData = response.data.user;

      if (userData) {
        setUserDetail({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          credits: userData.credits, // Injects your true database token balance
        });
      }
    } catch (error) {
      console.error("Failed fetching user details from /api/user:", error);
    }
  }, [user]);

  // Watch Clerk session shifts live
  useEffect(() => {
    if (isClerkLoaded) {
      if (user) {
        refreshUserContext();
      } else {
        setUserDetail(null); // Clear state immediately on user logout
      }
    }
  }, [user, isClerkLoaded, refreshUserContext]);

  return (
    <UserDetailContext.Provider
      value={{ userDetail, setUserDetail, refreshUserContext }}
    >
      {children}
    </UserDetailContext.Provider>
  );
}

export function useUserDetail() {
  const context = React.useContext(UserDetailContext);
  if (!context) {
    throw new Error("useUserDetail must be used within a UserDetailProvider");
  }
  return context;
}
