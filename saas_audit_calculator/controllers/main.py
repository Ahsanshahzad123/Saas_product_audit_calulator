import json
import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class SaasCalculatorController(http.Controller):

    @http.route('/saas-calculator', type='http', auth='public', website=True)
    def calculator_page(self, **kwargs):
        return request.render('saas_audit_calculator.calculator_page', {})

    @http.route('/saas-calculator/submit-lead', type='json', auth='public', methods=['POST'], csrf=False)
    def submit_lead(self, **post):
        try:
            body = json.loads(request.httprequest.data or '{}')
        except (ValueError, TypeError):
            body = post

        calc  = body.get('calculatorData', {}) or {}
        audit = body.get('auditResults',   {}) or {}
        team  = calc.get('team', {}) or {}

        vals = {
            'name':        body.get('name', ''),
            'email':       body.get('email') or calc.get('email', ''),
            'phone':       body.get('phone', ''),
            'company':     body.get('company', ''),
            'role':        body.get('role', ''),
            'website_url': body.get('website') or calc.get('website', ''),
            'challenge':   body.get('challenge', ''),
            # Calculator inputs
            'monthly_burn':    float(calc.get('burn', 0)    or 0),
            'monthly_revenue': float(calc.get('revenue', 0) or 0),
            'startup_stage':   calc.get('stage', ''),
            'architecture':    calc.get('arch', ''),
            # Team
            'team_pm':      int(team.get('pm',      0) or 0),
            'team_ux':      int(team.get('ux',      0) or 0),
            'team_eng':     int(team.get('eng',     0) or 0),
            'team_qa':      int(team.get('qa',      0) or 0),
            'team_devops':  int(team.get('devops',  0) or 0),
            'team_support': int(team.get('support', 0) or 0),
            # Audit results
            'health_score':         int(audit.get('healthScore',       0) or 0),
            'efficiency_grade':     str(audit.get('grade',             '') or ''),
            'risk_level':           str(audit.get('risk',              '') or ''),
            'monthly_cod':          float(audit.get('monthlyCOD',      0) or 0),
            'annual_cod':           float(audit.get('annualCOD',       0) or 0),
            'burn_inefficiency':    float(audit.get('burnIneff',        0) or 0),
            'delay_cost':           float(audit.get('delayCost',        0) or 0),
            'lost_opportunity':     float(audit.get('lostOpp',          0) or 0),
            'refactor_cost':        float(audit.get('refactorCost',     0) or 0),
            'security_risk_cost':   float(audit.get('securityRisk',     0) or 0),
            'valuation_at_risk':    float(audit.get('valuationAtRisk',  0) or 0),
            'benchmark_percentile': int(audit.get('benchmarkPct',       0) or 0),
            # Meta
            'source':     body.get('source', 'saas_audit_calculator'),
            'ip_address': request.httprequest.remote_addr or '',
            'user_agent': request.httprequest.user_agent.string if request.httprequest.user_agent else '',
        }

        if not vals['email']:
            return {'success': False, 'error': 'Email is required'}

        # Create or update by email
        Lead = request.env['saas.audit.lead'].sudo()
        existing = Lead.search([('email', '=', vals['email'])], limit=1)
        if existing:
            existing.write(vals)
            lead_id = existing.id
        else:
            lead = Lead.create(vals)
            lead_id = lead.id

        _logger.info('SaaS Audit Lead saved: id=%s email=%s score=%s', lead_id, vals['email'], vals['health_score'])
        return {'success': True, 'lead_id': lead_id}

    @http.route('/saas-calculator/leads', type='http', auth='user', website=True)
    def leads_list(self, **kwargs):
        """Simple JSON dump of leads for admins (optional endpoint)."""
        leads = request.env['saas.audit.lead'].search([], limit=200)
        data = leads.read(['name', 'email', 'health_score', 'risk_level', 'monthly_cod', 'state', 'create_date'])
        return request.make_response(
            json.dumps(data, default=str),
            headers=[('Content-Type', 'application/json')]
        )
