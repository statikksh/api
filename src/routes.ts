import { FastifyInstance } from 'fastify'

import AuthenticationController from './controller/authentication.controller'
import UserController from './controller/user.controller'

import ProjectController from './controller/project.controller'
import ProjectBuildController from './controller/project-build.controller'

/**
 * Setups all controllers in a fastify application.
 */
async function routes(fastify: FastifyInstance) {
    AuthenticationController.setup(fastify)
    UserController.setup(fastify)

    ProjectController.setup(fastify)
    ProjectBuildController.setup(fastify)
}

export default routes
