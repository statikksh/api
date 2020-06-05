import fastify from 'fastify'

import { PrismaClient } from '@prisma/client'

/**
 * Creates the web application.
 */
export default function createApplication({ database }: ApplicationSources) {
    const application = fastify()

    application.decorate('database', database)

    return application
}

/**
 * The application sources.
 */
export interface ApplicationSources {
    database: PrismaClient
}
