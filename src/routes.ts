import { FastifyInstance } from 'fastify'

import UserController from './controller/user.controller'

/**
 * Setups all controllers in a fastify application.
 */
async function routes(fastify: FastifyInstance) {
    UserController.setup(fastify)
}

export default routes
