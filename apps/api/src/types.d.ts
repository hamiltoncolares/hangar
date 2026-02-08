import 'fastify';
import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string };
    user: {
      id: string;
      email: string;
      role: string;
      status: string;
      name?: string | null;
    };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      status: string;
      name?: string | null;
    };
    userTierIds?: string[];
  }

  interface FastifyInstance {
    authenticate: any;
    requireAdmin: any;
  }
}
