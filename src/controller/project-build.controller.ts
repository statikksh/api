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
 * 200 OK           => { id: string, startedAt: number } (Project Build)
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
 * Shorthand for POST /build/stop.
 */
const stopShorthand: RouteShorthandOptions = {
    config: { verifyJWT: true },
    schema: {
        querystring: fluentSchema.object().prop('id', fluentSchema.string().required())
    }
}

/**
 * POST /build/stop
 *
 * Stops a running project build.
 *
 * [Query Paramethers]
 * build: string (id of the build to be stopped)
 *
 * [Status Code]
 * 200 OK           - Build stopped.
 * 401 Unauthorized - The user behind the JWT token isn't the project owner.
 * 403 Forbidden    - The target build isn't curently running.
 * 404 Not Found    - Target build does not exists.
 *
 * [Response Body]
 * 200 OK           => { id: string, startedAt: number } (Build)
 * 401 Unauthorized => { message: "You're not allowed to stop builds of this project." } (Error)
 * 403 Forbidden    => { message: "The build must be running to be stopped." } (Error)
 * 404 Not Found    => { message: "Resource not found." } (Error)
 */
async function stop(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const buildId = request.query.id
    const userId = (request.user as { sub: number }).sub

    const build = await request.database.projectBuild.findOne({
        where: { id: buildId },
        select: {
            id: true,
            stage: true,
            project: {
                select: { id: true, ownerId: true }
            }
        }
    })

    if (!build) return reply.callNotFound()
    if (build.project.ownerId !== userId) {
        reply.status(401)
        throw new Error("You're not allowed to stop builds of this project.")
    }

    if (build.stage !== 'RUNNING') {
        reply.status(403)
        throw new Error("The build isn't currently running.")
    }

    request.amqp.builder.stopProjectBuild(build.project.id)

    const updatedBuild = await request.database.projectBuild.update({
        where: { id: buildId },
        data: { stage: 'FAILED' }
    })

    return updatedBuild
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
    fastify.post('/build/stop', stopShorthand, buildServiceIsAvailable ? stop : serviceUnavailable)
}

export default {
    setup
}
