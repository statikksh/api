import { FastifyInstance } from 'fastify'

import fastifyPlugin from 'fastify-plugin'

import amqp, { ConsumeMessage } from 'amqplib'

// The name of the queue for builds.
const BUILDS_QUEUE = 'builds'

// The name of the queue for builds logs.
const BUILD_LOGS_QUEUE = 'build-logs'

// The name of the exchange for builds logs.
const BUILD_LOGS_EXCHANGE = 'statikk.build.logs'

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

    const buildLogsQueue = await channel.assertQueue(BUILD_LOGS_QUEUE, { durable: false })
    await channel.bindQueue(buildLogsQueue.queue, BUILD_LOGS_EXCHANGE, '')

    await channel.consume(buildLogsQueue.queue, (message: ConsumeMessage | null) => {
        if (!message || !message.properties.headers.repository) return
        channel.ack(message)

        fastify.websocket.in(message.properties.headers.repository).emit('project/live-logs', {
            project: message.properties.headers.repository,
            message: message.content
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

    fastify.decorateRequest('amqp', {
        builder: {
            buildProject
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
    }
}
