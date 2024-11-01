import fs from 'fs'
import path from 'path'
import { NextFunction, Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload, sign } from 'jsonwebtoken'
import createHttpError from 'http-errors'
import { AppDataSource } from '../config/data-source'
import { RefreshToken } from '../entity/RefreshToken'
import { Config } from '../config'

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

            let privateKey: Buffer
            try {
                privateKey = fs.readFileSync(
                    path.join(__dirname, '../../certs/private.pem'),
                )
            } catch {
                const error = createHttpError(
                    500,
                    'Error while reading private key',
                )
                next(error)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = sign(payload, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h',
                issuer: 'auth-service',
            })

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1 hour
                httpOnly: true,
            })

            // Persist the refresh token in the database
            const MS_IN_MONTH = 1000 * 60 * 60 * 24 * 30
            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken)
            const newRefreshToken = await refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + MS_IN_MONTH),
            })

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '30d',
                issuer: 'auth-service',
                jwtid: newRefreshToken.id.toString(),
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
