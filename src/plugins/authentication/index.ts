import { FastifyInstance } from 'fastify'

import fastifyPlugin from 'fastify-plugin'
import fastifyJWT from 'fastify-jwt'

const authentication = fastifyPlugin(async (fastify: FastifyInstance) => {
    fastify.register(fastifyJWT, {
        secret: process.env.APP_SECRET || 'secret'
    })

    fastify.addHook('preHandler', async (request, reply) => {
        const verifyJWT = reply.context.config.verifyJWT as boolean

        if (verifyJWT) {
            await request.jwtVerify()
        }
    })
})

export default authentication
