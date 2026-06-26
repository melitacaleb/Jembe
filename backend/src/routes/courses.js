const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { requireAuth, requireOrganization } = require('../middleware/auth');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireOrganization, ctrl.create);
router.get('/mine', requireAuth, requireOrganization, ctrl.mine);
router.post('/:id/enroll', requireAuth, ctrl.enroll);
router.get('/enrollments/mine', requireAuth, ctrl.myEnrollments);
router.put('/:id/progress', requireAuth, ctrl.updateProgress);

module.exports = router;
