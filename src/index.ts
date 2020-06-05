import createApplication from './main'

import { PrismaClient } from '@prisma/client'

import { APP_PORT } from './utils/environment'

const prisma = new PrismaClient()
const application = createApplication({
    database: prisma
})

application.listen(APP_PORT, (error: Error, address: string) => {
    if (!error) {
        console.log(`(server) the application is live at ${address}`)
    } else {
        console.error('(server) cannot start the server')
        console.error(' '.repeat('(server)'.length), error.message)
    }
})
