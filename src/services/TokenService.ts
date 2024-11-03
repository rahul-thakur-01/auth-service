import { JwtPayload, sign } from 'jsonwebtoken'
import createHttpError from 'http-errors'
import { Config } from '../config'
import { RefreshToken } from '../entity/RefreshToken'
import { User } from '../entity/User'
import { Repository } from 'typeorm'

export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload) {
        let privateKey: string
        if (!Config.PRIVATE_KEY) {
            const error = createHttpError(500, 'Private key not found')
            throw error
        }
        try {
            privateKey = Config.PRIVATE_KEY
        } catch {
            const error = createHttpError(
                500,
                'Error while reading private key',
            )
            throw error
        }

        const accessToken = sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
            issuer: 'auth-service',
        })
        return accessToken
    }

    generateRefreshToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: 'HS256',
            expiresIn: '30d',
            issuer: 'auth-service',
            jwtid: String(payload.id),
        })
        return refreshToken
    }

    async persistRefreshToken(user: User) {
        // Persist the refresh token in the database
        const MS_IN_MONTH = 1000 * 60 * 60 * 24 * 30
        const newRefreshToken = await this.refreshTokenRepository.save({
            user: user,
            expiresAt: new Date(Date.now() + MS_IN_MONTH),
        })
        return newRefreshToken
    }

    async deleteRefreshToken(id: number) {
        console.log(id)
        await this.refreshTokenRepository.delete(id)
    }
}
