import { NextFunction, Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            console.log(result.array())
            res.status(400).json({ errors: result.array() })
            return
        }
        const { firstName, lastName, email, password } = req.body
        this.logger.debug('New user registration request', {
            firstName,
            lastName,
            email,
            password: '***',
        })
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })
            this.logger.info(`User with id ${user.id} has been created`)
            const accessToken = 'accessToken'
            const refreshToken = 'asdfsdfsadf'
            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1 hour
                httpOnly: true,
            })
            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
                httpOnly: true,
            })
            res.status(201).json({ id: user.id })
        } catch (err) {
            next(err)
            return
        }
    }
}
