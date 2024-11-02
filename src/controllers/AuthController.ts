import { NextFunction, Response } from 'express'
import { RegisterUserRequest, LoginUserRequest, AuthRequest } from '../types'

import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/TokenService'
import createHttpError from 'http-errors'
import { CredentialService } from '../services/CredentialService'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            // console.log(result.array())
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

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)
            // Record the refresh token in the database
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)
            // Embed the refresh token id in the payload
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

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

    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        // Validate the request
        const result = validationResult(req)
        if (!result.isEmpty()) {
            console.log(result.array())
            res.status(400).json({ errors: result.array() })
            return
        }
        const { email, password } = req.body
        this.logger.debug('New request to login a user', {
            email,
            password: '***',
        })

        // check is usersname (email) exists in the database
        // Compare the password with the hashed password
        // Generate Token
        // Add token to the Cookie
        // Return the reposnse(id)

        try {
            const user = await this.userService.findByEmail(email)
            if (!user) {
                const error = createHttpError(
                    400,
                    'Email or password does not match',
                )
                next(error)
                return
            }
            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            )
            if (!passwordMatch) {
                const error = createHttpError(
                    400,
                    'Email or password does not match',
                )
                next(error)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)
            // Record the refresh token in the database
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)
            // Embed the refresh token id in the payload
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

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
            res.json({ id: user.id })
        } catch (err) {
            next(err)
            return
        }
    }

    async self(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.auth || !req.auth.sub) {
                return res.status(401).json({ message: 'Unauthorized' })
            }

            const user = await this.userService.findById(Number(req.auth.sub))

            res.json({ ...user, password: undefined })
        } catch (error) {
            next(error)
        }
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        console.log((req as AuthRequest).auth)
        try {
            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            const user = await this.userService.findById(Number(req.auth.sub))
            if (!user) {
                const error = createHttpError(
                    400,
                    'User with the token could not find',
                )
                next(error)
                return
            }

            // Persist the refresh token
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            // Delete old refresh token
            console.log(req.auth.id)
            await this.tokenService.deleteRefreshToken(Number(req.auth.id))

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 1, // 1d
                httpOnly: true, // Very important
            })

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true, // Very important
            })

            this.logger.info('User has been logged in', { id: user.id })
            res.json({ id: user.id })
        } catch (err) {
            next(err)
            return
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await this.tokenService.deleteRefreshToken(Number(req.auth.id))
            this.logger.info('Refresh token has been deleted', {
                id: req.auth.id,
            })
            this.logger.info('User has been logged out', { id: req.auth.sub })

            res.clearCookie('accessToken')
            res.clearCookie('refreshToken')
            res.json({})
        } catch (err) {
            next(err)
            return
        }
    }
}
