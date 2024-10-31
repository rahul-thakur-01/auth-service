import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { UserData } from '../types/index'
import createHttpError from 'http-errors'
import { Roles } from '../constants'
import bcrypt from 'bcrypt'
export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })
        } catch {
            const error = createHttpError(
                500,
                'Failed to store user data in the database',
            )
            throw error
        }
    }
}
