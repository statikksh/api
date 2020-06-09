import fastify from 'fastify'

import { PrismaClient } from '@prisma/client'

import authenticationPlugin from './plugins/authentication'

import routes from './routes'

/**
 * Creates the web application.
 */
export default function createApplication({ database }: ApplicationSources) {
    const application = fastify()

    application.decorate('database', database)
    application.decorateRequest('database', database)

    application.register(authenticationPlugin) // JWT authentication plugin

    application.register(routes)

    return application
}

/**
 * The application sources.
 */
export interface ApplicationSources {
    database: PrismaClient
}
