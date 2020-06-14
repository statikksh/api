import { PrismaClient } from '@prisma/client'

import { StatikkAMQP } from '../../plugins/amqp'

declare module 'fastify' {
    export interface FastifyInstance {
        database: PrismaClient
    }

    export interface FastifyRequest {
        amqp: StatikkAMQP
        database: PrismaClient
    }
}
