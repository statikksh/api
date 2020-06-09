import fastify from 'fastify'

import { PrismaClient } from '@prisma/client'

import authenticationPlugin from './plugins/authentication'

/**
 * Creates the web application.
 */
export default function createApplication({ database }: ApplicationSources) {
    const application = fastify()

    application.decorate('database', database)

    application.register(authenticationPlugin) // JWT authentication plugin

    return application
}

/**
 * The application sources.
 */
export interface ApplicationSources {
    database: PrismaClient
}
