import fastify from 'fastify'

import { PrismaClient } from '@prisma/client'

import authenticationPlugin from './plugins/authentication'
import websocketPlugin from './plugins/websocket'
import amqpPlugin from './plugins/amqp'

import handleNotFound from './plugins/not-found.handler'

import routes from './routes'

/**
 * Creates the web application.
 */
export default function createApplication({ database }: ApplicationSources) {
    const application = fastify()

    application.decorate('database', database)
    application.decorateRequest('database', database)

    application.setNotFoundHandler(handleNotFound)

    application.register(authenticationPlugin) // JWT authentication plugin
    application.register(websocketPlugin) // WebSocket server
    application.register(amqpPlugin) // Statikk AMQP plugin

    application.register(routes)

    return application
}

/**
 * The application sources.
 */
export interface ApplicationSources {
    database: PrismaClient
}
