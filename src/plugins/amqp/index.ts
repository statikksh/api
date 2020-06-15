import { FastifyInstance } from 'fastify'

import fastifyPlugin from 'fastify-plugin'

import amqp from 'amqplib'

// The name of the queue for builds.
const BUILDS_QUEUE = 'builds'

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
