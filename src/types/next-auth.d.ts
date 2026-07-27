import { AppRoleKey } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRoleKey;
    };
  }

  interface User {
    role: AppRoleKey;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRoleKey;
  }
}
