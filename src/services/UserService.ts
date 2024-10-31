import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { UserData } from '../types/index'
import createHttpError from 'http-errors'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
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
