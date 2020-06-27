import { FastifyInstance } from 'fastify'

import fastifyPlugin from 'fastify-plugin'

import amqp, { ConsumeMessage } from 'amqplib'

// The name of the queue for builds.
const BUILDS_QUEUE = 'builds'

// The name for queue and exchange for build logs
const BUILD_LOGS_EXCHANGE = 'statikk.build.logs'
const BUILD_LOGS_QUEUE = 'build-logs'

// The name for queue and exchange for build status
const BUILD_STATUS_EXCHANGE = 'statikk.build.status'
const BUILD_STATUS_QUEUE = 'build-status'

/**
 * The AMQP plugin.
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
    const amqpConnectionURL = process.env.AMQP_CONNECTION_URL

    if (!amqpConnectionURL) {
        fastify.log.warn('AMQP_CONNECTION_URL is missing.')
        fastify.log.warn('Build-related services will not work.')
        return
    }

    const amqpConnection = await amqp.connect(amqpConnectionURL)
    const channel = await amqpConnection.createChannel()

    await channel.assertQueue(BUILDS_QUEUE, {
        durable: true
    })

    await channel.assertExchange(BUILD_LOGS_EXCHANGE, 'fanout')
    await channel.assertExchange(BUILD_STATUS_EXCHANGE, 'fanout')

    const buildLogsQueue = await channel.assertQueue(BUILD_LOGS_QUEUE, { durable: false })
    await channel.bindQueue(buildLogsQueue.queue, BUILD_LOGS_EXCHANGE, '')

    const buildStatusQueue = await channel.assertQueue(BUILD_STATUS_QUEUE, { durable: false })
    await channel.bindQueue(buildStatusQueue.queue, BUILD_STATUS_EXCHANGE, '')

    await channel.consume(buildLogsQueue.queue, (message: ConsumeMessage | null) => {
        if (!message || !message.properties.headers.repository) return
        channel.ack(message)

        fastify.websocket.in(message.properties.headers.repository).emit('project/live-logs', {
            project: message.properties.headers.repository,
            message: message.content
        })
    })

    await channel.consume(buildStatusQueue.queue, async (message: ConsumeMessage | null) => {
        if (!message) return

        const repository = message.properties.headers.repository
        const status = message.properties.headers.status

        if (!repository || !status) return

        channel.ack(message)

        const project = await fastify.database.project.findOne({
            where: { id: repository },
            select: {
                builds: {
                    take: 1,
                    where: { stage: 'RUNNING' },
                    select: { id: true }
                }
            }
        })

        if (!project) return
        const build = project.builds[0]

        await fastify.database.projectBuild.update({
            where: { id: build.id },
            data: { stage: status }
        })
    })

    /**
     * Starts a project build.
     */
    function buildProject(id: string, repository: string) {
        return channel.sendToQueue(BUILDS_QUEUE, Buffer.alloc(0), {
            headers: {
                action: 'start',
                'repository-id': id,
                repository
            }
        })
    }

    /**
     * Stops a running project build.
     */
    function stopProjectBuild(id: string) {
        return channel.sendToQueue(BUILDS_QUEUE, Buffer.alloc(0), {
            headers: {
                action: 'stop',
                'repository-id': id
            }
        })
    }

    fastify.decorateRequest('amqp', {
        builder: {
            buildProject,
            stopProjectBuild
        }
    })
})

/**
 * The AMQP Statikk functions.
 */
export interface StatikkAMQP {
    /**
     * Functions for the builder workers.
     */
    builder: {
        /**
         * Queues a project build.
         */
        buildProject(id: string, repository: string): boolean

        /**
         * Stops a running project build.
         */
        stopProjectBuild(id: string): boolean
    }
}
