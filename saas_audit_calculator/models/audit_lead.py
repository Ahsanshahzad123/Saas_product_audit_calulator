from odoo import api, fields, models


class SaasAuditLead(models.Model):
    _name = 'saas.audit.lead'
    _description = 'SaaS Opportunity Audit Lead'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'
    _rec_name = 'email'

    # ── Contact ────────────────────────────────────────────────────────────
    name        = fields.Char('Full Name')
    email       = fields.Char('Email', required=True, index=True)
    phone       = fields.Char('Phone')
    company     = fields.Char('Company / Startup Name')
    role        = fields.Char('Role / Title')
    website_url = fields.Char('Website / Idea URL')
    challenge   = fields.Text('Biggest Challenge')

    # ── Audit Inputs ───────────────────────────────────────────────────────
    audience_type = fields.Selection([
        ('idea_personal',    'Idea + Personal Investment'),
        ('idea_funded',      'Idea + Seed / Investor Funding'),
        ('unsatisfied_team', 'Have a Dev Team — Unsatisfied with Results'),
        ('mvp_investment',   'Have MVP + Investment — Need Better Team'),
        ('mvp_ai',           'Built MVP with AI Tools — Facing Technical Issues'),
        ('non_technical',    'Non-Technical Founder — Limited Budget'),
    ], string='Audience Type')

    saas_type = fields.Selection([
        ('b2b',         'B2B SaaS (Business clients)'),
        ('b2c',         'B2C / Consumer SaaS'),
        ('marketplace', 'Marketplace / Platform'),
        ('enterprise',  'Enterprise Software'),
    ], string='SaaS Type')

    annual_revenue_goal = fields.Float('Target Annual Revenue (Year 1, $)', digits=(16, 2))
    available_budget    = fields.Float('Available Development Budget ($)',   digits=(16, 2))

    product_complexity = fields.Selection([
        ('mvp',        'Simple MVP'),
        ('standard',   'Standard SaaS'),
        ('complex',    'Complex Platform'),
        ('enterprise', 'Enterprise-grade'),
    ], string='Product Complexity')

    target_users = fields.Selection([
        ('small',  '< 500 users'),
        ('medium', '500 – 5,000 users'),
        ('large',  '5K – 50K users'),
        ('xlarge', '50,000+ users'),
    ], string='Target User Scale')

    launch_timeline = fields.Selection([
        ('asap',   'ASAP (< 3 months)'),
        ('short',  '3 – 6 months'),
        ('medium', '6 – 12 months'),
        ('long',   '12+ months'),
    ], string='Desired Launch Timeline')

    ai_type = fields.Selection([
        ('no_ai',     'No AI features'),
        ('ai_api',    'AI via API (OpenAI, Claude…)'),
        ('ai_custom', 'Custom ML model'),
        ('ai_core',   'AI-powered core product'),
    ], string='AI / Technology Type')

    industry = fields.Selection([
        ('general',    'General / Other'),
        ('ecommerce',  'E-commerce / Retail'),
        ('hr_ops',     'HR / Operations'),
        ('education',  'Education / EdTech'),
        ('legal',      'Legal / LegalTech'),
        ('healthcare', 'Healthcare / MedTech (HIPAA)'),
        ('fintech',    'Finance / Fintech (PCI, SOC 2)'),
    ], string='Industry / Compliance')

    # ── Audit Results ──────────────────────────────────────────────────────
    opportunity_score      = fields.Integer('Opportunity Score (0–100)')
    monthly_rev_lost       = fields.Float('Monthly Revenue at Risk ($)',       digits=(16, 2))
    loss_6_months          = fields.Float('Loss if Delayed 6 Months ($)',      digits=(16, 2))
    loss_12_months         = fields.Float('Loss if Delayed 12 Months ($)',     digits=(16, 2))
    budget_rec_min         = fields.Float('Recommended Budget — Min ($)',      digits=(16, 2))
    budget_rec_max         = fields.Float('Recommended Budget — Max ($)',      digits=(16, 2))
    monthly_build_cost_min = fields.Float('Monthly Build Cost — Min ($)',      digits=(16, 2))
    monthly_build_cost_max = fields.Float('Monthly Build Cost — Max ($)',      digits=(16, 2))
    total_budget_min       = fields.Float('Total Project Budget — Min ($)',    digits=(16, 2))
    total_budget_max       = fields.Float('Total Project Budget — Max ($)',    digits=(16, 2))
    roi_months             = fields.Integer('Estimated Break-even (months)')
    build_timeline         = fields.Integer('Estimated Build Timeline (months)')
    verdict                = fields.Char('Opportunity Verdict')

    # ── Meta ───────────────────────────────────────────────────────────────
    source       = fields.Char('Source', default='saas_audit_calculator')
    ip_address   = fields.Char('IP Address')
    submitted_at = fields.Datetime('Submitted At', default=fields.Datetime.now)
    state        = fields.Selection([
        ('new',       'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('converted', 'Converted'),
        ('lost',      'Lost'),
    ], string='Status', default='new', index=True)
    notes = fields.Text('Internal Notes')

    def action_mark_contacted(self):
        self.write({'state': 'contacted'})

    def action_mark_qualified(self):
        self.write({'state': 'qualified'})

    def action_mark_converted(self):
        self.write({'state': 'converted'})
