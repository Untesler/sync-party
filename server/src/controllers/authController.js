// ENDPOINTS
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createUser } from '../admin-cli/operations.js';
/**
 * @api {post} /api/auth User Authentication
 * @apiName auth
 * @apiGroup authController
 * @apiDescription Called everytime the user reloads the app.
 * @apiPermission none
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiSuccess {Object} user User Object containing id, username & role.
 * @apiError notAuthenticated Client did not provide a cookie or authenticated session does not exist.
 */
const auth = (req, res, logger) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.isAuthenticated() && req.user) {
        return res.json({
            success: true,
            msg: 'isAuthenticated',
            user: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role
            }
        });
    }
    else {
        logger.log('info', 'Unauthenticated user tried to visit protected route.');
        return res.status(401).json({ msg: 'notAuthenticated' });
    }
});
/**
 * @api {post} /api/login Login
 * @apiName login
 * @apiGroup authController
 * @apiDescription Login form: User sends their login data to receive their Express session cookie
 * @apiPermission none
 * @apiParam {String} username Username.
 * @apiParam {String} password Password.
 * @apiSuccess {Object} user User Object.
 * @apiSuccess {Header} setCookie Session cookie.
 * @apiError notAuthenticated Username was not found or password is wrong.
 */
const login = (req, res) => {
    // At this point the user is already authenticated by passport middleware.
    if (req.user) {
        return res.json({
            success: true,
            msg: 'loginSuccessful',
            user: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role
            }
        });
    }
    else {
        return res.json({ sucess: false });
    }
};
/**
 * @api {post} /api/logout Logout
 * @apiName logout
 * @apiGroup authController
 * @apiDescription Invalidates the user's session
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 */
const logout = (req, res, logger) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        req.logout();
        return res.status(200).json({ success: true, msg: 'logoutSuccessful' });
    }
    catch (error) {
        logger.log('error', error);
        res.status(500).json({ success: false, msg: 'error' });
        return Promise.reject(new Error(error));
    }
});
/**
 * @api {post} /api/register Register
 * @apiName register
 * @apiGroup authController
 * @apiDescription Create new user
 * @apiPermission none
 * @apiParam {String} username Username.
 * @apiParam {String} password Password.
 * @apiSuccess {Object} success Created status.
 */
const register = (req, res, models) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const success = yield createUser(models, req.body.username, 'admin', req.body.password); // actually 'admin' has to be 'user'
        if (success) {
            res.status(201).json({ success: true, msh: 'account created' });
        }
        else {
            res.status(200).json({ success: false, msg: 'can not create account' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, msg: 'error' });
    }
});
export default { auth, login, logout, register };
