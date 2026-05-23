from odoo import api, fields, models


class SaasAuditLead(models.Model):
    _name = 'saas.audit.lead'
    _description = 'SaaS Audit Calculator Lead'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'
    _rec_name = 'email'

    # ── Contact ────────────────────────────────────────────────────────────
    name        = fields.Char('Full Name')
    email       = fields.Char('Email', required=True, index=True)
    phone       = fields.Char('Phone')
    company     = fields.Char('Company Name')
    role        = fields.Char('Role / Title')
    website_url = fields.Char('Website URL')
    challenge   = fields.Text('Biggest Challenge')

    # ── Calculator Inputs ──────────────────────────────────────────────────
    monthly_burn    = fields.Float('Monthly Burn Rate ($)', digits=(16, 2))
    monthly_revenue = fields.Float('Monthly Revenue ($)',   digits=(16, 2))
    startup_stage   = fields.Selection([
        ('seed',          'Seed'),
        ('pre_series_a',  'Pre-Series A'),
        ('series_a',      'Series A'),
        ('series_b_plus', 'Series B+'),
    ], string='Startup Stage')
    architecture = fields.Selection([
        ('mvp_spaghetti',        'MVP (Spaghetti Code)'),
        ('early_structured',     'Early Stage (Some Structure)'),
        ('scaling_modular',      'Scaling (Microservices/Modular)'),
        ('mature_best_practice', 'Mature (Best Practices)'),
    ], string='Architecture Maturity')

    # ── Team Breakdown ─────────────────────────────────────────────────────
    team_pm      = fields.Integer('Project Managers',       default=0)
    team_ux      = fields.Integer('UX/UI Designers',        default=0)
    team_eng     = fields.Integer('Software Engineers',     default=0)
    team_qa      = fields.Integer('QA Engineers',           default=0)
    team_devops  = fields.Integer('DevOps Engineers',       default=0)
    team_support = fields.Integer('Support Engineers',      default=0)
    team_total   = fields.Integer('Total Team Size', compute='_compute_team_total', store=True)

    # ── Audit Results ──────────────────────────────────────────────────────
    health_score          = fields.Integer('Health Score (0–100)')
    efficiency_grade      = fields.Char('Efficiency Grade')
    risk_level            = fields.Selection([
        ('Low',      'Low'),
        ('Medium',   'Medium'),
        ('High',     'High'),
        ('Critical', 'Critical'),
    ], string='Risk Level')
    monthly_cod           = fields.Float('Monthly Cost of Delay ($)', digits=(16, 2))
    annual_cod            = fields.Float('Annual Cost of Delay ($)',   digits=(16, 2))
    burn_inefficiency     = fields.Float('Burn Inefficiency ($)',      digits=(16, 2))
    delay_cost            = fields.Float('Delay Cost ($)',             digits=(16, 2))
    lost_opportunity      = fields.Float('Lost Opportunity ($)',       digits=(16, 2))
    refactor_cost         = fields.Float('Refactor Cost ($)',          digits=(16, 2))
    security_risk_cost    = fields.Float('Security Risk Cost ($)',     digits=(16, 2))
    valuation_at_risk     = fields.Float('Valuation at Risk ($)',      digits=(16, 2))
    benchmark_percentile  = fields.Integer('Benchmark Percentile')

    # ── Meta ───────────────────────────────────────────────────────────────
    source          = fields.Char('Source', default='saas_audit_calculator')
    ip_address      = fields.Char('IP Address')
    user_agent      = fields.Char('User Agent')
    submitted_at    = fields.Datetime('Submitted At', default=fields.Datetime.now)
    state           = fields.Selection([
        ('new',        'New'),
        ('contacted',  'Contacted'),
        ('qualified',  'Qualified'),
        ('converted',  'Converted'),
        ('lost',       'Lost'),
    ], string='Status', default='new', index=True)
    notes           = fields.Text('Internal Notes')

    @api.depends('team_pm', 'team_ux', 'team_eng', 'team_qa', 'team_devops', 'team_support')
    def _compute_team_total(self):
        for rec in self:
            rec.team_total = (
                rec.team_pm + rec.team_ux + rec.team_eng
                + rec.team_qa + rec.team_devops + rec.team_support
            )

    def action_mark_contacted(self):
        self.write({'state': 'contacted'})

    def action_mark_qualified(self):
        self.write({'state': 'qualified'})

    def action_mark_converted(self):
        self.write({'state': 'converted'})
