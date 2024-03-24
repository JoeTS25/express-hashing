const express = require("express");
const db = require("../db");
const {ensureLoggedIn, ensureAdmin, ensureCorrectUser} = require("../middleware/auth");
const Message = require("../models/message");

const router = new express.Router();
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureCorrectUser, async (req, res, next) => {
    try {
        let message = await Message.get(req.params.id);
        return res.json({message});
    } catch (e) {
        return next(e)
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureCorrectUser, async (req, res, next) => {
    try{
        let message = await Message.create(req.body.from_user, req.body.to_username, req.body.body);
        return res.json({message});
    } catch (e) {
        return next(e)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureCorrectUser, async (req, res, next) => {
    try {let message = await Message.markRead(req.params.id);
        return res.json({message});
    } catch (e) {
        return next(e)
    }
})
