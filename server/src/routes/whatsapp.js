const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/whatsapp.controller');

router.get('/status',         authenticate, ctrl.status);
router.post('/connect',       authenticate, ctrl.connect);
router.post('/disconnect',    authenticate, ctrl.disconnect);
router.post('/campaign/start', authenticate, ctrl.campaignStart);
router.get('/campaign/status', authenticate, ctrl.campaignStatus);
router.post('/campaign/stop',  authenticate, ctrl.campaignStop);

module.exports = router;
