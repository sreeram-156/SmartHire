from database import SessionLocal
from models import User
from auth import hash_password


db = SessionLocal()

admin_email = "admin@smarthire.com"
admin_password = "Admin@123"

admin = db.query(User).filter(
    User.email == admin_email
).first()

if admin:
    admin.name = "SmartHire Admin"
    admin.password_hash = hash_password(admin_password)
    admin.role = "admin"
    admin.status = "Active"

    db.commit()

    print("Admin account updated successfully")
else:
    admin = User(
        name="SmartHire Admin",
        email=admin_email,
        password_hash=hash_password(admin_password),
        role="admin",
        status="Active"
    )

    db.add(admin)
    db.commit()

    print("Admin created successfully")

db.close()