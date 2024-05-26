import { NextFunction, Response } from 'express';
import { TenantService } from '../services/TenantService';
import { CreateTenantRequest } from '../types';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}
    async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const { name, address } = req.body;
        const validatorErrors = validationResult(req);
        if (!validatorErrors.isEmpty()) {
            return res.status(400).json({ error: validatorErrors.array() });
        }

        this.logger.debug('Request for creating a tenant.', req.body);

        try {
            const tenant = await this.tenantService.create({ name, address });

            this.logger.info('Tenant has been created', { id: tenant.id });

            return res.status(201).json({ id: tenant.id });
        } catch (err) {
            next(err);
        }
    }
}
