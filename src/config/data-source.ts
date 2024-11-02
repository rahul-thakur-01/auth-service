import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Config } from '.'

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: Config.DB_HOST,
    port: Number(Config.DB_PORT),
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,

    // Dont't use synchronize in production - otherwise you may lose data
    // synchronize: Config.NODE_ENV === 'dev' || Config.NODE_ENV === 'test', i configured this in the test file
    synchronize: false,
    logging: false,
    entities: ['src/entity/*.{ts,js}'],
    migrations: ['src/migration/*.{ts,js}'],
    subscribers: [],
})
