from ..config import Config


def register_routes(app):
    from .health import health_bp
    from .public import public_bp
    from .auth import auth_bp
    from .admin_auth import admin_auth_bp
    from .admin_setup import admin_setup_bp
    from .equipment import equipment_bp
    from .projects import projects_bp
    from .bookings import bookings_bp
    from .student_dashboard import student_dashboard_bp
    from .faculty import faculty_bp
    from .admin_panel import admin_panel_bp
    from .ai import ai_bp
    from .notifications import notifications_bp
    from .waitlist import waitlist_bp
    from .qr import qr_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(public_bp, url_prefix="/api/public")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_auth_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_setup_bp, url_prefix="/api/admin")
    app.register_blueprint(equipment_bp, url_prefix="/api/equipment")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(student_dashboard_bp, url_prefix="/api/student")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
    app.register_blueprint(admin_panel_bp, url_prefix="/api/admin/panel")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(waitlist_bp, url_prefix="/api/waitlist")
    app.register_blueprint(qr_bp, url_prefix="/api/qr")

    if Config.FLASK_ENV == "development":
        from .seed import seed_bp
        app.register_blueprint(seed_bp, url_prefix="/api/dev")
