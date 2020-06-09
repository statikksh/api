import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Creates a hash from a password.
 */
async function hash(password: string) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    return bcrypt.hash(password, salt)
}

/**
 * Checks a password against a hash.
 */
async function check(hash: string, password: string) {
    return bcrypt.compare(password, hash)
}

export default { check, hash }
