import { FastifyInstance } from 'fastify'

import AuthenticationController from './controller/authentication.controller'
import UserController from './controller/user.controller'

/**
 * Setups all controllers in a fastify application.
 */
async function routes(fastify: FastifyInstance) {
    AuthenticationController.setup(fastify)
    UserController.setup(fastify)
}

export default routes
