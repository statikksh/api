import { FastifyInstance } from 'fastify'

import fastifyPlugin from 'fastify-plugin'

import socketio, { Socket } from 'socket.io'

/**
 * The websocket fastify plugin.
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
    const websocket = socketio(fastify.server)

    fastify.decorate('websocket', websocket)
    fastify.decorateRequest('websocket', websocket)

    websocket.on('connection', async (socket: Socket) => {
        const authorizationHeader = socket.handshake.headers.authorization

        if (!authorizationHeader) return socket.disconnect(true)
        const [, token] = authorizationHeader.split(' ')
        try {
            const tokenContents = await fastify.jwt.verify<{ sub: number }>(token)
            const user = await fastify.database.user.findOne({
                where: { id: tokenContents.sub },
                select: { id: true }
            })

            socket.emit('ready', user)
        } catch (error) {
            socket.disconnect(true)
        }
    })
})
