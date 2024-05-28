import { User } from '../entity/User';
import { UserData } from '../types';
import { Repository } from 'typeorm';
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
export class UserService {
    constructor(private userRepository: Repository<User>) {
        this.userRepository = userRepository;
    }

    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        });
        if (user) {
            const error = createHttpError(400, 'Email already exists.');
            throw error;
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                tenant: tenantId ? { id: tenantId } : undefined,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to store the data in the database',
            );
            throw error;
        }
    }

    async findByEmailWithPassword(email: string) {
        return await this.userRepository.findOne({
            where: { email: email },
            select: [
                'id',
                'firstName',
                'lastName',
                'email',
                'role',
                'password',
            ],
        });
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id: id },
        });
    }

    async fetchAll() {
        return await this.userRepository.find();
    }

    async deleteById(id: number) {
        return await this.userRepository.delete(id);
    }

    async updateById(id: number, updatedUser: UserData) {
        return await this.userRepository.update(id, updatedUser);
    }
}
