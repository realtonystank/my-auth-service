import express, { NextFunction, Request, Response } from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/TenantService';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import { CreateTenantRequest } from '../types';
import logger from '../config/logger';
import authenticate from '../middlewares/authenticate';
const router = express.Router();

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService, logger);

router.post(
    '/',
    authenticate,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.create(req as CreateTenantRequest, res, next),
);

export default router;
