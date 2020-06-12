import { FastifyInstance, RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify'
import { ServerResponse } from 'http'

import fluentSchema from 'fluent-schema'

import bcrypt from '../utils/bcrypt'

/**
 * The shorthand options for `POST /auth`.
 */
const authShorthand: RouteShorthandOptions = {
    schema: {
        body: fluentSchema
            .object()
            .prop(
                'email',
                fluentSchema
                    .string()
                    .format('email')
                    .required()
            )
            .prop('password', fluentSchema.string().required())
    }
}

/**
 * A utility function to spawn 401 Unauthorized errors for the authorization process.
 */
function incorrectUsernameOrPassword(reply: FastifyReply<ServerResponse>) {
    reply.status(401)
    throw new Error('Incorrect username or password.')
}

/**
 * POST /auth
 *
 * Generates an authorization token (JWT) from valid credentials (`email` and `password`)
 *
 * [Status Codes]
 * 200 OK           - Successfully authenticated, token is present at response body.
 * 401 Unauthorized - Invalid credentials provided.
 *
 * [Request Body]
 * email:    string (required)
 * password: string (required)
 *
 * [Response Body]
 * 200 OK           => { token: string }
 * 401 Unauthorized => { message: "Incorrect username or password." } (Error)
 */
async function auth(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const { email, password }: Record<string, string> = request.body
    const user = await request.database.user.findOne({
        where: { email },
        select: { id: true, password: true }
    })

    if (!user) return incorrectUsernameOrPassword(reply)

    const passwordHash = user.password
    const passwordMatches = await bcrypt.check(passwordHash, password)

    if (!passwordMatches) return incorrectUsernameOrPassword(reply)

    const token = await reply.jwtSign({ sub: user.id }, { expiresIn: '30 days' })
    return { token }
}

/**
 * Setups the user authentication controller.
 */
function setup(fastify: FastifyInstance) {
    fastify.post('/auth', authShorthand, auth)
}

export default {
    setup
}
