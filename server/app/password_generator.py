import random
def generate_password(length, n_capitals, n_numbers, n_letters):
    capitals = random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k = n_capitals)
    numbers = random.choices('0123456789', k = n_numbers)
    letters = random.choices('abcdefghijklmnopqrstuvwxyz', k = n_letters)
    special = random.choices('@#$*?/\|_&%!^?', k = length - n_capitals - n_numbers - n_letters)

    password = capitals + numbers + letters + special
    random.shuffle(password)
    return str("".join(password))

def generate_org_code():
    return "ORG-" + generate_password(5,0,5,0)