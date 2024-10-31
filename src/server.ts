import app from './app'
import { Config } from './config'
import logger from './config/logger'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        app.listen(PORT, () => {
            logger.info(`Server listing on port ${PORT}`)
        })
    } catch (err) {
        console.error('Error starting server:', err)
        process.exit(1)
    }
}

startServer()
