import { FastifyReply, FastifyRequest } from 'fastify'
import { ServerResponse } from 'http'

const STATUS_CODE = 404

/**
 * The handler for 404 requests.
 */
export default async function handleNotFound(_: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    reply.status(STATUS_CODE)
    throw new Error('Resource not found.')
}
