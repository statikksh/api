import { FastifyInstance, RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify'
import { ServerResponse } from 'http'

import fluentSchema from 'fluent-schema'

/**
 * Shorthand for PUT /projects.
 */
const storeShorthand: RouteShorthandOptions = {
    config: { verifyJWT: true },
    schema: {
        body: fluentSchema
            .object()
            .prop('name', fluentSchema.string().required())
            .prop('repository', fluentSchema.string().required())
    }
}

// Regex from https://github.com/jonschlinkert/is-git-url/blob/master/index.js
const IS_GIT_URL = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/

/**
 * PUT /projects
 *
 * Creates a new project from given `name` and `repository`.
 *
 * [Request Body]
 * name: string (required)
 * repository: string (required, git repository url)
 *
 * [Status Code]
 * 200 OK           - Project successfully created.
 * 400 Bad Request  - The repository URL is invalid.
 * 401 Unauthorized - Cannot find the user behind the JWT authorization token inside the database.
 * 409 Conflict     - A project with the same name already exists.
 *
 * [Response Body]
 * 200 OK           => { id: uuid-string, name: string, repository_url: string }
 * 400 Bad Request  => { message: "The field `repository` must be a valid git repository URL." } (Error)
 * 401 Unauthorized => { message: "You're not allowed to access this resource." } (Error)
 * 409 Conflict     => { message: "A project with the same name already exists inside our database." } (Error)
 */
async function store(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const { name, repository }: Record<string, string> = request.body

    // checks for invalid git url
    if (!IS_GIT_URL.test(repository)) {
        reply.status(400)
        throw new Error('The field `repository` must be a valid git repository URL.')
    }

    // checks if a project with the same name already exists
    const projectWithSameName = await request.database.project.findOne({
        where: { name },
        select: { id: true }
    })

    if (projectWithSameName) {
        reply.status(409)
        throw new Error('A project with the same name already exists inside our database.')
    }

    // create project
    const userId = (request.user as { sub: number }).sub
    const user = await request.database.user.findOne({
        where: { id: userId },
        select: { id: true }
    })

    if (user) {
        const project = await request.database.project.create({
            data: {
                name,
                repository,
                owner: { connect: { id: user.id } }
            }
        })

        return project
    } else {
        reply.status(401)
        throw new Error("You're not allowed to access this resource.")
    }
}

/**
 * Setups the project controller.
 */
function setup(fastify: FastifyInstance) {
    fastify.put('/projects', storeShorthand, store)
}

export default {
    setup
}
