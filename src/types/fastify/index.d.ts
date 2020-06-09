import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
    export interface FastifyInstance {
        database: PrismaClient
    }

    export interface FastifyRequest {
        database: PrismaClient
    }
}
