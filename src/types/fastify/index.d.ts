import { PrismaClient } from '@prisma/client'

import { StatikkAMQP } from '../../plugins/amqp'

import { Server as WebSocketServer } from 'socket.io'

declare module 'fastify' {
    export interface FastifyInstance {
        websocket: WebSocketServer
        database: PrismaClient
    }

    export interface FastifyRequest {
        amqp: StatikkAMQP
        database: PrismaClient
        websocket: WebSocketServer
    }
}
