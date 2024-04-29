import express from 'express';
const router = express.Router();

router.post('/create', (req, res) => {
    return res.status(201).json();
});

export default router;
