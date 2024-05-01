import { User } from '../entity/User';
import { UserData } from '../types';
import { Repository } from 'typeorm';
import createHttpError from 'http-errors';
export class UserService {
    constructor(private userRepository: Repository<User>) {
        this.userRepository = userRepository;
    }

    async create({ firstName, lastName, email, password }: UserData) {
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to store the data in the database',
            );
            throw error;
        }
    }
}
