import { Request, NextFunction, Response } from 'express';
import { TenantService } from '../services/TenantService';
import { AuthRequest, CreateTenantRequest } from '../types';
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
    async fetchAllTenants(req: Request, res: Response, next: NextFunction) {
        this.logger.debug('Request to fetch all tenants');
        try {
            const tenants = await this.tenantService.fetchAll();
            return res.status(200).json({ tenants });
        } catch (err) {
            next(err);
            return;
        }
    }

    async fetchTenantById(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        this.logger.info('Request to fetch tenant ', id);
        try {
            const tenantData = await this.tenantService.fetchById(Number(id));

            if (!tenantData) {
                return res.status(404).json({ error: 'Possibly incorrect id' });
            }
            this.logger.info('tenant ', id, ' found');

            return res.json({ tenant: tenantData });
        } catch (err) {
            next(err);
            return;
        }
    }

    async deleteTenantById(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        const _req = req as AuthRequest;
        this.logger.info(
            'Request to delete tenant ',
            id,
            ' by the user ',
            _req.auth.sub,
        );
        try {
            await this.tenantService.deleteById(Number(id));
            this.logger.info('Tenant ', id, ' successfully deleted');
            return res.status(204).send();
        } catch (err) {
            next(err);
            return;
        }
    }
    async updateTenantById(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        const { name, address } = req.body;
        const _req = req as AuthRequest;
        this.logger.info(
            'Request to delete tenant ',
            id,
            ' by the user ',
            _req.auth.sub,
        );

        try {
            await this.tenantService.updateById({ name, address }, Number(id));
            this.logger.info('tenant ', id, ' successfully deleted');
            return res.status(204).send();
        } catch (err) {
            next(err);
            return;
        }
    }
}
