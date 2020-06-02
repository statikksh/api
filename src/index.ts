import createApplication from './main'

import { APP_PORT } from './utils/environment'

const application = createApplication()

application.listen(APP_PORT, (error: Error, address: string) => {
    if (!error) {
        console.log(`(server) the application is live at ${address}`)
    } else {
        console.error('(server) cannot start the server')
        console.error(' '.repeat('(server)'.length), error.message)
    }
})
