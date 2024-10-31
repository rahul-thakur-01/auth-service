import request from 'supertest'
import app from '../../src/app'

describe('POST /auth/register', () => {
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
    })

    describe('Given missing fields', () => {})
})
