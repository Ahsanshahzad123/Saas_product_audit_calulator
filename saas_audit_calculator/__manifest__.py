{
    'name': 'SaaS Product Audit Calculator',
    'version': '16.0.1.0.0',
    'summary': 'Interactive SaaS audit calculator with lead capture for website landing pages',
    'description': '''
        A full-featured SaaS execution audit calculator that:
        - Calculates Health Score, Cost of Delay, Burn Inefficiency, and more
        - Captures visitor leads with full contact and audit data
        - Stores all submissions in Odoo CRM-style lead records
        - Renders a detailed diagnostic report in real time
        - Embeds cleanly into any Odoo website landing page
    ''',
    'author': 'SaaS Audit Team',
    'website': '',
    'category': 'Website/Marketing',
    'license': 'LGPL-3',
    'depends': ['website', 'mail'],
    'data': [
        'security/ir.model.access.csv',
        'views/audit_lead_views.xml',
        'views/menus.xml',
        'views/templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'saas_audit_calculator/static/src/css/calculator.css',
            'saas_audit_calculator/static/src/js/calculator.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}
