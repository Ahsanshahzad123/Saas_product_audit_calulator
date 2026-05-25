import json
import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class SaasAuditController(http.Controller):

    @http.route('/saas-calculator', type='http', auth='public', website=True)
    def calculator_page(self, **kwargs):
        return request.render('saas_audit_calculator.calculator_page', {})

    @http.route('/saas-calculator/submit-lead', type='http', auth='public', methods=['POST'], csrf=False)
    def submit_lead(self, **post):
        # Parse JSON body directly — avoids Odoo JSON-RPC dispatcher expectations
        try:
            body = json.loads(request.httprequest.data.decode('utf-8'))
        except Exception:
            body = {}

        audit     = body.get('auditResults', {}) or {}
        lead_type = body.get('leadType', 'calculator')

        vals = {
            # Contact
            'name':        body.get('name', '') or '',
            'email':       body.get('email', '') or '',
            'phone':       body.get('phone', '') or '',
            'company':     body.get('company', '') or '',
            'role':        body.get('role', '') or '',
            'website_url': body.get('website', '') or '',
            'challenge':   body.get('challenge', '') or '',
            # Inputs
            'audience_type':       body.get('audienceType', '') or '',
            'saas_type':           body.get('saasType', '') or '',
            'product_complexity':  body.get('complexityKey', '') or '',
            'target_users':        body.get('usersKey', '') or '',
            'launch_timeline':     body.get('timelineKey', '') or '',
            'ai_type':             body.get('aiKey', '') or '',
            'industry':            body.get('industryKey', '') or '',
            'annual_revenue_goal': float(body.get('revenueGoal', 0) or 0),
            'available_budget':    float(body.get('budget', 0) or 0),
            # Results
            'opportunity_score':      int(audit.get('opportunityScore', 0) or 0),
            'monthly_rev_lost':       float(audit.get('monthlyRevLost', 0) or 0),
            'loss_6_months':          float(audit.get('loss6Months', 0) or 0),
            'loss_12_months':         float(audit.get('loss12Months', 0) or 0),
            'monthly_build_cost_min': float(audit.get('monthlyBuildMin', 0) or 0),
            'monthly_build_cost_max': float(audit.get('monthlyBuildMax', 0) or 0),
            'total_budget_min':       float(audit.get('totalBudgetMin', 0) or 0),
            'total_budget_max':       float(audit.get('totalBudgetMax', 0) or 0),
            'roi_months':             int(audit.get('roiMonths', 0) or 0),
            'build_timeline':         int(audit.get('buildTimeline', 0) or 0),
            'verdict':                str(audit.get('verdict', '') or ''),
            'recommended_team_size':  str(audit.get('teamSize', '') or ''),
            # Meta
            'lead_type':  lead_type,
            'source':     body.get('source', 'saas_audit_calculator'),
            'ip_address': request.httprequest.remote_addr or '',
        }

        if not vals['email']:
            resp = json.dumps({'success': False, 'error': 'Email is required'})
            return request.make_response(resp, headers=[('Content-Type', 'application/json')])

        Lead = request.env['saas.audit.lead'].sudo()
        existing = Lead.search([('email', '=', vals['email'])], limit=1)

        if existing:
            # Never downgrade a full audit_request record with a plain calculator save
            if existing.lead_type == 'audit_request' and lead_type == 'calculator':
                lead_id = existing.id
            else:
                existing.write(vals)
                lead_id = existing.id
        else:
            lead_id = Lead.create(vals).id

        _logger.info('SaaS Audit Lead saved: id=%s email=%s type=%s score=%s',
                     lead_id, vals['email'], lead_type, vals['opportunity_score'])

        resp = json.dumps({'success': True, 'lead_id': lead_id})
        return request.make_response(resp, headers=[('Content-Type', 'application/json')])

    @http.route('/saas-calculator/leads', type='http', auth='user', website=True)
    def leads_list(self, **kwargs):
        leads = request.env['saas.audit.lead'].search([], limit=200)
        data = leads.read(['name', 'email', 'lead_type', 'opportunity_score',
                           'verdict', 'loss_12_months', 'state', 'create_date'])
        return request.make_response(
            json.dumps(data, default=str),
            headers=[('Content-Type', 'application/json')]
        )
