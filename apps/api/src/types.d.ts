import 'fastify';

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
