const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getLeads,
  getLead,
  updateLead,
  deleteLead,
  deleteAllLeads,
  deleteSelectedLeads,
  getStats,
} = require('../controllers/leads.controller');

router.get('/stats',           authenticate, getStats);
router.get('/',                authenticate, getLeads);
router.delete('/all',          authenticate, deleteAllLeads);
router.post('/bulk-delete',    authenticate, deleteSelectedLeads);
router.get('/:id',             authenticate, getLead);
router.patch('/:id',           authenticate, updateLead);
router.delete('/:id',          authenticate, deleteLead);

module.exports = router;
