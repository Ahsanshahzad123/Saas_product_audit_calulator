import json
import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class SaasAuditController(http.Controller):

    @http.route('/saas-calculator', type='http', auth='public', website=True)
    def calculator_page(self, **kwargs):
        return request.render('saas_audit_calculator.calculator_page', {})

    @http.route('/saas-calculator/submit-lead', type='json', auth='public', methods=['POST'], csrf=False)
    def submit_lead(self, **post):
        try:
            body = json.loads(request.httprequest.data or '{}')
        except (ValueError, TypeError):
            body = post

        audit = body.get('auditResults', {}) or {}

        vals = {
            # Contact
            'name':        body.get('name', ''),
            'email':       body.get('email', ''),
            'phone':       body.get('phone', ''),
            'company':     body.get('company', ''),
            'role':        body.get('role', ''),
            'website_url': body.get('website', ''),
            'challenge':   body.get('challenge', ''),
            # Inputs
            'audience_type':       body.get('audienceType', ''),
            'saas_type':           body.get('saasType', ''),
            'annual_revenue_goal': float(body.get('revenueGoal', 0) or 0),
            'available_budget':    float(body.get('budget', 0) or 0),
            # Results
            'opportunity_score': int(audit.get('opportunityScore', 0) or 0),
            'monthly_rev_lost':  float(audit.get('monthlyRevLost', 0) or 0),
            'loss_6_months':     float(audit.get('loss6Months', 0) or 0),
            'loss_12_months':    float(audit.get('loss12Months', 0) or 0),
            'budget_rec_min':    float(audit.get('budgetMin', 0) or 0),
            'budget_rec_max':    float(audit.get('budgetMax', 0) or 0),
            'roi_months':        int(audit.get('roiMonths', 0) or 0),
            'build_timeline':    int(audit.get('buildTimeline', 0) or 0),
            'verdict':           str(audit.get('verdict', '') or ''),
            # Meta
            'source':     body.get('source', 'saas_audit_calculator'),
            'ip_address': request.httprequest.remote_addr or '',
        }

        if not vals['email']:
            return {'success': False, 'error': 'Email is required'}

        Lead = request.env['saas.audit.lead'].sudo()
        existing = Lead.search([('email', '=', vals['email'])], limit=1)
        if existing:
            existing.write(vals)
            lead_id = existing.id
        else:
            lead = Lead.create(vals)
            lead_id = lead.id

        _logger.info('SaaS Audit Lead: id=%s email=%s score=%s', lead_id, vals['email'], vals['opportunity_score'])
        return {'success': True, 'lead_id': lead_id}

    @http.route('/saas-calculator/leads', type='http', auth='user', website=True)
    def leads_list(self, **kwargs):
        leads = request.env['saas.audit.lead'].search([], limit=200)
        data = leads.read(['name', 'email', 'opportunity_score', 'verdict', 'loss_12_months', 'state', 'create_date'])
        return request.make_response(
            json.dumps(data, default=str),
            headers=[('Content-Type', 'application/json')]
        )
