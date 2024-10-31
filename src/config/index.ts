import { config } from 'dotenv'
import path from 'path'
config({
    path: path.resolve(__dirname, `../../.env/${process.env.NODE_ENV}.env`),
})

const { PORT, NODE_ENV, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } =
    process.env

export const Config = {
    PORT: PORT || 3000,
    NODE_ENV,
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
}
