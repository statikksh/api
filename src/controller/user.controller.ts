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
 * Stores a new user inside the database.
 *
 * [Status Codes]
 * 200 OK          - User successfully registered, JWT token is present at `token`.
 * 400 Bad Request - The passwords `password` and `confirm_password` do not match.
 * 409 Conflict    - The user is already registered inside the database.
 *
 * [Request Body]
 * name:             string (required)
 * email:            string (required)
 * password:         string (required, length > 6)
 * confirm_password: string (required, same as `password`)
 *
 * [Response Body]
 * 200 OK          => { token: string }
 * 400 Bad Request => { message: "Passwords don't match" } (Error)
 * 409 Conflict    => { message: "User already registered." } (Error)
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
