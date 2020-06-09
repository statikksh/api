import { FastifyInstance } from 'fastify'

/**
 * Setups the user controller.
 */
function setup(fastify: FastifyInstance) {
    fastify.get('/user', async () => ({}))
    fastify.put('/signup', async () => ({}))
}

export default {
    setup
}
