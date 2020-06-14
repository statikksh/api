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

    fastify.decorateRequest('amqp', {
        builder: {}
    })
})

/**
 * The AMQP Statikk functions.
 */
export interface StatikkAMQP {
    /**
     * Functions for the builder workers.
     */
    builder: {}
}
