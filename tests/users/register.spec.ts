import request from 'supertest'
import app from '../../src/app'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { truncateTables } from '../utils'
import { User } from '../../src/entity/User'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'

describe('POST /auth/register', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    // beforeEach(async () => {
    //     // database truncate
    //     await connection.dropDatabase()
    //     await connection.synchronize()
    //     await truncateTables(connection)
    // })

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase()
        await connection.synchronize()
        await truncateTables(connection)
    }, 20000)

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return 201', async () => {
            // AAA
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            // Act

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert

            expect(response.status).toBe(201)
        })

        it('should reeturn valid josn', async () => {
            // AAA
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            // Act

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert applicatoin/json in the response header content-type field
            // By default response.headers['content-type'] is a string(plain text);
            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'))
        })

        it('should persist the user in the database', async () => {
            // AAA
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            // Act

            await request(app).post('/auth/register').send(userData)

            // Assert

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })

        it('should return an id of the created user', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'K',
                email: 'rakesh@mern.space',
                password: 'password',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.body).toHaveProperty('id')
            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            )
        })

        it('should assign a customer role', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(1)
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('should store the hashed password in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            await request(app).post('/auth/register').send(userData)

            // Act
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find({ select: ['password'] })
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('should return a 400 if the email is already in use', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            const users = await userRepository.find()

            // Assert
            expect(response.status).toBe(400)
            expect(users).toHaveLength(1)
        })

        it('should return a access token and refresh token in the cookie', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            let accessToken: string | null = null
            let refreshToken: string | null = null

            interface Headers {
                'set-cookie': string[]
            }

            // Assuming response.header has type assertion as Headers
            const cookies: string[] =
                (response.header as unknown as Headers)['set-cookie'] || []

            cookies.forEach((cookie: string) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            // Assertions
            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })

        it('should store the refresh token in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@gmail.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)
            // const refreshTokens = await refreshTokenRepository.find()
            // expect(refreshTokens).toHaveLength(1)

            // query builder method to get the refresh token
            const tokens = await refreshTokenRepository
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: response.body.id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })

    describe('Given missing fields', () => {
        it('should return 400 if the email field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                password: 'password',
            }

            // Act

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.status).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })
    })

    describe('Given invalid fields', () => {
        it('should return 400 if the email is invalid', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: '  john@gmail.com  ',
                password: 'password',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            const user = users[0]
            expect(user.email).toBe('john@gmail.com')
        })
    })
})
