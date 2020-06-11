import { FastifyInstance } from 'fastify'

/**
 * Setups the user authentication controller.
 */
function setup(fastify: FastifyInstance) {
    fastify.post('/auth', async () => ({}))
}

export default {
    setup
}
