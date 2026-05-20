// src/context/UserDetailContext.ts
import { createContext } from "react";

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  credits: number;
}

export interface UserDetailContextType {
  userDetail: UserDetail | null;
  setUserDetail: (user: UserDetail | null) => void;
  refreshUserContext: () => Promise<void>;
}

export const UserDetailContext = createContext<
  UserDetailContextType | undefined
>(undefined);
