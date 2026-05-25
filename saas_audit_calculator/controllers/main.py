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
        try:
            body = json.loads(request.httprequest.data.decode('utf-8'))
        except Exception:
            body = {}

        audit     = body.get('auditResults', {}) or {}
        lead_type = body.get('leadType', 'calculator')
        email     = (body.get('email', '') or '').strip()
        company   = (body.get('company', '') or '').strip()
        contact   = (body.get('name', '') or '').strip()

        if not email:
            resp = json.dumps({'success': False, 'error': 'Email is required'})
            return request.make_response(resp, headers=[('Content-Type', 'application/json')])

        # crm.lead.name is required — build from available context
        if lead_type == 'audit_request':
            lead_name = 'SaaS Audit Request — ' + (company or contact or email)
        else:
            lead_name = 'SaaS Calculator — ' + (company or contact or email)

        score   = int(audit.get('opportunityScore', 0) or 0)
        verdict = str(audit.get('verdict', '') or '')

        # Map opportunity score to CRM priority
        if score >= 80:
            priority = '3'
        elif score >= 60:
            priority = '2'
        elif score >= 40:
            priority = '1'
        else:
            priority = '0'

        vals = {
            # CRM standard fields
            'name':         lead_name,
            'partner_name': contact,
            'email_from':   email,
            'phone':        (body.get('phone', '') or '').strip(),
            'type':         'lead',
            'priority':     priority,
            'description':  self._build_description(body, audit, score, verdict),
            # Custom audit input fields
            'saas_audience_type':   body.get('audienceType') or False,
            'saas_type':            body.get('saasType') or False,
            'saas_complexity':      body.get('complexityKey') or False,
            'saas_target_users':    body.get('usersKey') or False,
            'saas_launch_timeline': body.get('timelineKey') or False,
            'saas_ai_type':         body.get('aiKey') or False,
            'saas_industry':        body.get('industryKey') or False,
            'saas_role':            (body.get('role', '') or '').strip(),
            'saas_challenge':       (body.get('challenge', '') or '').strip(),
            # Financial inputs
            'saas_revenue_goal':    float(body.get('revenueGoal', 0) or 0),
            'saas_budget':          float(body.get('budget', 0) or 0),
            # Audit results
            'saas_opportunity_score': score,
            'saas_monthly_rev_lost':  float(audit.get('monthlyRevLost', 0) or 0),
            'saas_loss_6_months':     float(audit.get('loss6Months', 0) or 0),
            'saas_loss_12_months':    float(audit.get('loss12Months', 0) or 0),
            'saas_monthly_build_min': float(audit.get('monthlyBuildMin', 0) or 0),
            'saas_monthly_build_max': float(audit.get('monthlyBuildMax', 0) or 0),
            'saas_total_budget_min':  float(audit.get('totalBudgetMin', 0) or 0),
            'saas_total_budget_max':  float(audit.get('totalBudgetMax', 0) or 0),
            'saas_roi_months':        int(audit.get('roiMonths', 0) or 0),
            'saas_build_timeline':    int(audit.get('buildTimeline', 0) or 0),
            'saas_verdict':           verdict,
            'saas_team_size':         str(audit.get('teamSize', '') or ''),
            # Meta
            'saas_lead_type':  lead_type,
            'saas_source':     body.get('source', 'saas_audit_calculator'),
            'saas_ip_address': request.httprequest.remote_addr or '',
        }

        Lead = request.env['crm.lead'].sudo()
        existing = Lead.search(
            [('email_from', '=', email), ('saas_source', '=', 'saas_audit_calculator')],
            limit=1)

        if existing:
            # Never downgrade an audit_request to a plain calculator save
            if existing.saas_lead_type == 'audit_request' and lead_type == 'calculator':
                lead_id = existing.id
            else:
                existing.write(vals)
                lead_id = existing.id
        else:
            lead_id = Lead.create(vals).id

        _logger.info('SaaS Audit CRM Lead saved: id=%s email=%s type=%s score=%s',
                     lead_id, email, lead_type, score)

        resp = json.dumps({'success': True, 'lead_id': lead_id})
        return request.make_response(resp, headers=[('Content-Type', 'application/json')])

    def _build_description(self, body, audit, score, verdict):
        lead_type = body.get('leadType', 'calculator')
        lines = ['=== {} ==='.format(
            'SaaS Audit Request' if lead_type == 'audit_request' else 'SaaS Calculator Result')]
        lines.append('')
        lines.append('Opportunity Score: {}/100 — {}'.format(score, verdict))

        rev_lost = audit.get('monthlyRevLost', 0) or 0
        loss12   = audit.get('loss12Months', 0) or 0
        if rev_lost:
            lines.append('Monthly Revenue at Risk: ${:,.0f}'.format(rev_lost))
        if loss12:
            lines.append('12-Month Delay Cost: ${:,.0f}'.format(loss12))

        bmin = audit.get('monthlyBuildMin', 0) or 0
        bmax = audit.get('monthlyBuildMax', 0) or 0
        bt   = audit.get('buildTimeline', 0) or 0
        roi  = audit.get('roiMonths', 0) or 0
        if bmin or bmax:
            lines.append('Monthly Build Cost: ${:,.0f} – ${:,.0f}'.format(bmin, bmax))
        if bt:
            lines.append('Build Timeline: {} months'.format(bt))
        if roi:
            lines.append('Break-even: ~{} months'.format(roi))
        team = audit.get('teamSize', '')
        if team:
            lines.append('Recommended Team: {}'.format(team))

        lines.append('')
        lines.append('--- Inputs ---')
        for key, label in [
            ('audienceType', 'Audience'), ('saasType', 'Product Type'),
            ('complexityKey', 'Complexity'), ('usersKey', 'Target Users'),
            ('timelineKey', 'Timeline'), ('aiKey', 'AI Type'), ('industryKey', 'Industry'),
        ]:
            val = body.get(key, '')
            if val:
                lines.append('{}: {}'.format(label, val))
        rev = body.get('revenueGoal', 0) or 0
        bud = body.get('budget', 0) or 0
        if rev:
            lines.append('Revenue Goal/Year: ${:,.0f}'.format(float(rev)))
        if bud:
            lines.append('Available Budget: ${:,.0f}'.format(float(bud)))
        challenge = (body.get('challenge', '') or '').strip()
        if challenge:
            lines.append('')
            lines.append('Biggest Challenge: {}'.format(challenge))
        return '\n'.join(lines)

    @http.route('/saas-calculator/leads', type='http', auth='user', website=True)
    def leads_list(self, **kwargs):
        leads = request.env['crm.lead'].search(
            [('saas_source', '=', 'saas_audit_calculator')], limit=200)
        data = leads.read(['name', 'email_from', 'saas_lead_type', 'saas_opportunity_score',
                           'saas_verdict', 'saas_loss_12_months', 'create_date'])
        return request.make_response(
            json.dumps(data, default=str),
            headers=[('Content-Type', 'application/json')]
        )
