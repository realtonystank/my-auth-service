import { CookieOptions, NextFunction, Request, Response } from 'express';
import { AuthRequest, RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../services/TokenService';
import createHttpError from 'http-errors';
import { CredentialService } from '../services/CredentialService';
import { Roles } from '../constants';

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
    ) {}

    setAccessTokenCookies(
        res: Response,
        accessToken: string,
        options: CookieOptions,
    ) {
        res.cookie('accessToken', accessToken, options);
    }

    setRefreshTokenCookies(
        res: Response,
        refreshToken: string,
        options: CookieOptions,
    ) {
        res.cookie('refreshToken', refreshToken, options);
    }

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, password } = req.body;

        this.logger.debug('New request to register a user', {
            firstName,
            lastName,
            email,
            password: '*******',
        });
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role: Roles.CUSTOMER,
            });
            this.logger.info('User has been registered.', { id: user.id });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            const accessTokenOptions = {
                domain: 'localhost',
                sameSite: true,
                maxAge: 1000 * 60 * 60,
                httpOnly: true,
            };
            this.setAccessTokenCookies(res, accessToken, accessTokenOptions);

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            const refreshToken = await this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            const refreshTokenOptions = {
                domain: 'localhost',
                sameSite: true,
                maxAge: 1000 * 60 * 60 * 24 * 60,
                httpOnly: true,
            };

            this.setRefreshTokenCookies(res, refreshToken, refreshTokenOptions);

            return res.status(201).json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { email, password } = req.body;
        this.logger.debug('New request to login a user', {
            email,
            passoword: '******',
        });
        try {
            const user = await this.userService.findByEmailWithPassword(email);
            if (!user) {
                return next(
                    createHttpError(400, 'email or password is not correct.'),
                );
            }

            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            );
            if (!passwordMatch) {
                return next(
                    createHttpError(400, 'email or password is not correct.'),
                );
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            const accessTokenOptions = {
                domain: 'localhost',
                sameSite: true,
                maxAge: 1000 * 60 * 60,
                httpOnly: true,
            };
            this.setAccessTokenCookies(res, accessToken, accessTokenOptions);

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            const refreshToken = await this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            const refreshTokenOptions = {
                domain: 'localhost',
                sameSite: true,
                maxAge: 1000 * 60 * 60 * 24 * 60,
                httpOnly: true,
            };
            this.setRefreshTokenCookies(res, refreshToken, refreshTokenOptions);
            this.logger.info('User has been logged in', { id: user.id });
            return res.status(200).json({ id: user.id });
        } catch (err) {
            next(err);
        }
    }
    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub));
        return res.json({ ...user, password: undefined });
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            this.logger.info(
                'generating new access and refresh token for user with id:',
                req.auth.sub,
            );

            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
            };
            const accessToken = this.tokenService.generateAccessToken(payload);

            const accessTokenOptions = {
                domain: 'localhost',
                sameSite: true,
                maxAge: 1000 * 60 * 60,
                httpOnly: true,
            };
            this.setAccessTokenCookies(res, accessToken, accessTokenOptions);

            const user = await this.userService.findById(Number(req.auth.sub));

            if (!user) {
                return next(
                    createHttpError(400, 'Could not find user with the token'),
                );
            }

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            await this.tokenService.deleteRefreshToken(Number(req.auth.id));

            const refreshToken = await this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });
            const refreshTokenOptions = {
                domain: 'localhost',
                sameSite: true,
                maxAge: 1000 * 60 * 60 * 24 * 60,
                httpOnly: true,
            };
            this.setRefreshTokenCookies(res, refreshToken, refreshTokenOptions);

            this.logger.info('User has been logged in', { id: user.id });

            return res.json({ id: user.id });
        } catch (err) {
            return next(createHttpError(500, ''));
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await this.tokenService.deleteRefreshToken(Number(req.auth.id));
            this.logger.info('Refresh token has been deleted', req.auth.id);
            this.logger.info('User has been logged out', req.auth.sub);

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(204).send();
        } catch (err) {
            return next(err);
        }
    }
}
