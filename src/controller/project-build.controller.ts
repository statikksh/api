import { FastifyInstance, RouteShorthandOptions, FastifyReply, FastifyRequest } from 'fastify'
import { ServerResponse } from 'http'

import fluentSchema from 'fluent-schema'

/**
 * Shorthand for POST /build/start.
 */
const startShorthand: RouteShorthandOptions = {
    config: { verifyJWT: true },
    schema: {
        querystring: fluentSchema.object().prop('project', fluentSchema.string().required())
    }
}

/**
 * POST /build/start
 *
 * Queues a project build.
 *
 * [Query Paramethers]
 * project: string (id of the project which the build will run)
 *
 * [Status Code]
 * 200 OK           - Project build may start soon.
 * 401 Unauthorized - The user behind the JWT token isn't the project owner.
 * 404 Not Found    - Project not found.
 *
 * [Response Body]
 * 200 OK           => { id: string, startedAt: number } ()
 * 401 Unauthorized => { message: "You're not allowed to run builds of this project." } (Error)
 * 404 Not Found    => { message: "Resource not found." } (Error)
 */
async function start(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const projectId = request.query.project
    const userId = (request.user as { sub: number }).sub

    const project = await request.database.project.findOne({
        where: { id: projectId }
    })

    if (!project) return reply.callNotFound()
    if (project.ownerId !== userId) {
        reply.status(401)
        throw new Error("You're not allowed to run builds of this project.")
    }

    request.amqp.builder.buildProject(project.id, project.repository)

    const build = await request.database.projectBuild.create({
        data: {
            stage: 'RUNNING',
            project: { connect: { id: project.id } }
        }
    })

    return build
}

/**
 * A handler used when the build service is unavailable.
 */
async function serviceUnavailable(_: any, reply: FastifyReply<ServerResponse>) {
    reply.status(503)
    throw new Error('The build service is unavailable.')
}

/**
 * Setups the project build controller.
 */
function setup(fastify: FastifyInstance) {
    const buildServiceIsAvailable = fastify.hasRequestDecorator('amqp')

    fastify.post('/build/start', startShorthand, buildServiceIsAvailable ? start : serviceUnavailable)
}

export default {
    setup
}
