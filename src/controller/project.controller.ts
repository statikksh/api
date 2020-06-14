import { FastifyInstance, RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify'
import { ServerResponse } from 'http'

import fluentSchema from 'fluent-schema'

// Regex from https://github.com/jonschlinkert/is-git-url/blob/master/index.js
const IS_GIT_URL = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/

/**
 * Shorthand for GET /projects.
 */
const indexShorthand: RouteShorthandOptions = {
    config: {
        verifyJWT: true
    }
}

/**
 * GET /projects
 *
 * List all projects of the authenticated user.
 *
 * [Status Code]
 * 200 OK - User project list available at response body.
 *
 * [Response Body]
 * 200 OK => [{ id: string, name: string, repository: string }] (Project)
 */
async function index(request: FastifyRequest) {
    const userId = (request.user as { sub: number }).sub
    const projects = await request.database.project.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, repository: true }
    })

    return projects
}

/**
 * Shorthand for DELETE /project/:id.
 */
const removeShorthand: RouteShorthandOptions = {
    config: { verifyJWT: true },
    schema: {
        body: fluentSchema.object().prop('name', fluentSchema.string().required())
    }
}

/**
 * DELETE /project/:id
 *
 * Deletes a project from the database.
 *
 * [Request Body]
 * name: string (required, must be the same as the project name)
 *
 * [Status Code]
 * 200 OK           - The project has been deleted.
 * 404 Not Found    - Project not found.
 * 401 Unauthorized - The user that requested the project delete is not the project owner.
 * 403 Forbidden    - Given name does not matches with project name.
 *
 * [Response Body]
 * 200 OK           => { success: true }
 * 404 Not Found    => { message: "Resource not found." } (Error)
 * 401 Unauthorized => { message: "You're not allowed to delete this project." } (Error)
 * 403 Forbidden    => { message: "The field `name` must match with the project name." } (Error)
 */
async function remove(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const projectId = request.params.id
    const project = await request.database.project.findOne({
        where: { id: projectId }
    })

    if (!project) return reply.callNotFound()

    if (project.ownerId !== (request.user as { sub: number }).sub) {
        reply.status(401)
        throw new Error("You're not allowed to delete this project.")
    }

    const { name }: Record<string, string> = request.body

    if (project.name === name) {
        await request.database.project.delete({ where: { id: project.id } })
        return {
            success: true
        }
    } else {
        reply.status(403)
        throw new Error('The field `name` must match with the project name.')
    }
}

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
 * Shorthand for PATCH /project/:id.
 */
const updateShorthand: RouteShorthandOptions = {
    config: { verifyJWT: true },
    schema: {
        body: fluentSchema
            .object()
            .prop('name', fluentSchema.string())
            .prop('repository', fluentSchema.string())
    }
}

/**
 * PATCH /project/:id
 *
 * Rename a project or change the git repository url.
 *
 * [Request Body]
 * name:       string (optional)
 * repository: string (optional, must be a valid git repository url)
 *
 * [Status Code]
 * 200 OK           - Project has been updated.
 * 400 Bad Request  - The field `repository` is not a valid git repository url.
 * 401 Unauthorized - User behind JWT is not allowed to update the project.
 * 404 Not Found    - Project not found inside database.
 *
 * [Response Body]
 * 200 OK           => { id: string, name: string, repository: string, ... } (Updated Project)
 * 400 Bad Request  => { message: "The field `repository` must be a valid git repository URL." } (Error)
 * 401 Unauthorized => { message: "You're not allowed to update this project." } (Error)
 * 404 Not Found    => { message: "Resource not found." } (Error)
 */
async function update(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
    const projectId = request.params.id
    const project = await request.database.project.findOne({ where: { id: projectId } })

    if (!project) return reply.callNotFound()
    if (project.ownerId !== (request.user as { sub: number }).sub) {
        reply.status(401)
        throw new Error("You're not allowed to update this project.")
    }

    const { name, repository }: Record<string, string> = request.body
    const updatedProjectData: Record<string, string> = {}

    if (name) updatedProjectData.name = name
    if (repository) {
        if (!IS_GIT_URL.test(repository)) {
            reply.status(400)
            throw new Error('The field `repository` must be a valid git repository URL.')
        }

        updatedProjectData.repository = repository
    }

    const updatedProject = await request.database.project.update({
        where: { id: project.id },
        data: updatedProjectData
    })

    return updatedProject
}

/**
 * Setups the project controller.
 */
function setup(fastify: FastifyInstance) {
    fastify.get('/projects', indexShorthand, index)
    fastify.put('/projects', storeShorthand, store)

    fastify.patch('/project/:id', updateShorthand, update)
    fastify.delete('/project/:id', removeShorthand, remove)
}

export default {
    setup
}
