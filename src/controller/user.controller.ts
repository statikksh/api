import { FastifyInstance, RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify'
import { ServerResponse } from 'http'

import fluentSchema from 'fluent-schema'
import bcrypt from '../utils/bcrypt'

/**
 * Shorthand for POST /register
 */
const storeShorthand: RouteShorthandOptions = {
    schema: {
        body: fluentSchema
            .object()
            .prop('name', fluentSchema.string().required())
            .prop(
                'email',
                fluentSchema
                    .string()
                    .format('email')
                    .required()
            )
            .prop(
                'password',
                fluentSchema
                    .string()
                    .minLength(6)
                    .required()
            )
            .prop('confirm_password', fluentSchema.string().required())
    }
}

/**
 * POST /register
 *
 * Creates a new user inside the database.
 *
 * [Status Reponse]
 *
 * - 200 (OK) returns a JWT token at `token`.
 * - 400 (Bad Request) is returned if with passwords don't match.
 * - 409 (Conflict) when the user is already registered inside the database.
 *
 * [Response Body]
 * 200 { token: string }
 *
 * [Request Body]
 * name: string
 * email: string
 * password: string
 * confirm_password: string
 */
async function store(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const { name, email, password, confirm_password }: Record<string, string> = request.body

    if (password !== confirm_password) {
        reply.status(400)
        throw new Error("Passwords don't match")
    }

    let user = await request.database.user.findOne({ where: { email } })

    if (!user) {
        const hashedPassword = await bcrypt.hash(password)
        user = await request.database.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        })

        return {
            token: await reply.jwtSign({ sub: user.id })
        }
    } else {
        reply.status(409)
        throw new Error('User already registered.')
    }
}

/**
 * Setups the user controller.
 */
function setup(fastify: FastifyInstance) {
    fastify.get('/user', async () => ({}))
    fastify.post('/register', storeShorthand, store)
}

export default {
    setup
}
