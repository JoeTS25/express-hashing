/** User class for message.ly */
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");



/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({username, password, first_name, last_name, phone}) {
    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError("Missing required data", 400);
    }
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
       VALUES($1, $2, $3, $4, $5)
       RETURNING id, username, password, first_name, last_name, phone`,
       [username, hashedPassword, first_name, last_name, phone]);
    return results.rows[0];
  }
  

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password FROM users WHERE username = $1`, [username]);
    const user = results.rows[0];
    return user && await bcrypt.compare(password, user.password);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
    `UPDATE users SET last_login_at = current_timestamp WHERE username = $1 RETURNING username`,
    [username]);
    if (!result.rows[0]) {
      throw new ExpressError("User does not exist", 404);
    }
  }

  static async all() {
    const result = await db.query(`SELECT username, first_name, last_name, phone`);
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
        FROM users WHERE username = $1`, [username]);
    if (result.rows.length === 0) {
      throw new ExpressError("User not found", 404);
    }
    return results.row[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = db.query(
      `SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.to_user, m.sent_at, m.read_at
       FROM messages AS m JOIN users AS u ON m.to_user = u.username
       WHERE from_username = $1`, [username]);
    return (await result).rows.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_user,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id, u.username, u.first_name, u.last_name, u.phone, m.to_user, m.sent_at, m.read_at
      FROM messages AS m JOIN users AS u ON m.from_user = u.username
      WHERE to_username = $1`, [username]);

    return (await result).rows.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_user,
        first_name: m.first_name,
        last_name: u.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }
}


module.exports = User;