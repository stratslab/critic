from dbutils import User


orig_create = None


def create(db, name, fullname, email, email_verified, password=None,
           status="current", external_user_id=None):
    return orig_create(db, name, fullname, email, True, password,
                status, external_user_id)


def getUserEmailAddress(username):
    global orig_create

    if User.create != create:
        orig_create = User.create
        User.create = staticmethod(create)
    return username
