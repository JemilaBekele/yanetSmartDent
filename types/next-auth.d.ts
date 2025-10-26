import { User as NextAuthUser, Session as NextAuthSession } from 'next-auth';
import { JWT as NextAuthJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends NextAuthUser {
    id: string;
    role: string;
    username: string;
    image: string;
  }

  interface Session extends NextAuthSession {
    user: {
      id: string;
      role: string;
      username: string;
      image: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends NextAuthJWT {
    id: string;
    role: string;
    username: string;
    image: string;
  }
}
