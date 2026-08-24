const fs = require('fs');
let code = fs.readFileSync('src/app/api/auth/[...nextauth]/route.ts', 'utf8');

// Fix token as any
code = code.replace(/\(token as any\)\. \=/g, ''); // Clear the broken lines first
// Wait, they are currently `(token as any). = user.systematicId;`
// Let's just completely replace the whole callbacks section.

const callbacksCode = `  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as any).systematicId = user.systematicId;
        (token as any).role = user.role;
      }
      
      // Always fetch latest data from DB to ensure session is up to date (Profile & Wallet)
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string }
          });
          if (dbUser) {
            (token as any).firstName = dbUser.firstName;
            (token as any).lastName = dbUser.lastName;
            (token as any).profilePhoto = dbUser.profilePhoto;
            (token as any).mainWalletBalance = dbUser.mainWalletBalance;
            (token as any).bonusWalletBalance = dbUser.bonusWalletBalance;
          }
        } catch (e) {
          console.error("JWT Session DB Sync Error", e);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).systematicId = token.systematicId as string;
        (session.user as any).role = token.role as string;
        (session.user as any).mainWalletBalance = token.mainWalletBalance as number;
        (session.user as any).bonusWalletBalance = token.bonusWalletBalance as number;
        (session.user as any).vipLevel = token.vipLevel as number;
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).profilePhoto = token.profilePhoto as string;
      }
      return session;
    }
  },`;

code = code.replace(/callbacks: \{[\s\S]*?\},[\s\n]*session:/, callbacksCode + '\n  session:');
fs.writeFileSync('src/app/api/auth/[...nextauth]/route.ts', code);
