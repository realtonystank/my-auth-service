import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import { isJwt } from '../utils';
import { RefreshToken } from '../../src/entity/RefreshToken';

describe('POST /auth/register', () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('Given all fields', () => {
        it('should return the 201 status code', async () => {
            //Arrange
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret1234',
            };
            //Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            //Assert

            expect(response.statusCode).toBe(201);
        });
        it('should return valid json response', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret1234',
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.headers['content-type']).toEqual(
                expect.stringContaining('json'),
            );
        });
        it('should persist the user in the database', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret1234',
            };

            await request(app).post('/auth/register').send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });
        it('should return the id of the user', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret1234',
            };

            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(res.body).toHaveProperty('id');
            expect((res.body as { id: number }).id).toBeDefined;
        });
        it('should assign a customer role', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret1234',
            };

            await request(app).post('/auth/register').send(userData);

            const userRepository = connection.getRepository(User);

            const users = await userRepository.find();
            expect(users[0]).toHaveProperty('role');
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });
        it('should store the hashed password in the database', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret1234',
            };

            await request(app).post('/auth/register').send(userData);
            const userRepository = connection.getRepository(User);

            const users = await userRepository.find({ select: ['password'] });
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });
        it('should return 400 status code if email already exist', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret1234',
            };
            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            const users = await userRepository.find();

            expect(res.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
        it('should return the access token and refresh token inside a cookie', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };

            const res = await request(app)
                .post('/auth/register')
                .send(userData);
            interface Headers {
                ['set-cookie']: string[];
            }
            let accessToken: string | null = null;
            let refreshToken: string | null = null;

            const cookies =
                (res.headers as unknown as Headers)['set-cookie'] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1];
                }
                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1];
                }
            });

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });
        it('should store the refresh token in the database', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };

            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            const refreshTokenRepo = connection.getRepository(RefreshToken);
            // const refreshTokens = await refreshTokenRepo.find();
            // expect(refreshTokens).toHaveLength(1);

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: res.body.id,
                })
                .getMany();

            expect(tokens).toHaveLength(1);
        });
    });
    describe('Fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                password: 'secret1234',
            };

            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(400);
            expect(res.body.errors).toStrictEqual([
                {
                    type: 'field',
                    msg: 'Email is required!',
                    path: 'email',
                    location: 'body',
                },
                {
                    type: 'field',
                    value: '',
                    msg: 'Please enter a valid email address',
                    path: 'email',
                    location: 'body',
                },
            ]);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
        it('should return 400 status code if firstName is missing', async () => {
            const userData = {
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
        });
        it('should return 400 status code if lastName is missing', async () => {
            const userData = {
                firstName: 'Priyansh',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
        });
        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(400);
        });
    });
    describe('Fields are not in proper format', () => {
        it('should trim the email field', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: ' rajwars.priyansh@gmail.com ',
                password: 'secret1234',
            };

            await request(app).post('/auth/register').send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const user = users[0];
            expect(user.email).toBe('rajwars.priyansh@gmail.com');
        });
        it('should return 400 status code if email is not valid email', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: ' rajwars.priyansh.com ',
                password: 'secret1234',
            };

            const res = await request(app)
                .post('/auth/register')
                .send(userData);
            expect(res.statusCode).toBe(400);
        });
        it('should return 400 status code if password length is less than 8 characters', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: '123456',
            };

            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(400);
        });
    });
});
