import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    systematicId: string;
    role: string;
    mainWalletBalance: number;
    bonusWalletBalance: number;
    vipLevel: number;
  }

  interface Session {
    user: User & {
      id: string;
      systematicId: string;
      role: string;
      mainWalletBalance: number;
      bonusWalletBalance: number;
      vipLevel: number;
    };
  }
}
