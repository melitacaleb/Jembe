const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, ctrl.create);
router.get('/mine', requireAuth, ctrl.mine);
router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);
router.post('/:id/order', requireAuth, ctrl.order);
router.get('/orders/mine', requireAuth, ctrl.myOrders);
router.put('/orders/:id/status', requireAuth, ctrl.updateOrderStatus);

module.exports = router;
