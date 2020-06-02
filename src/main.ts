import fastify from 'fastify'

/**
 * Creates the web application.
 */
export default function createApplication() {
    const application = fastify()

    return application
}
