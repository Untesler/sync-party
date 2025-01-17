var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import path from 'path';
import { insertNewMediaItem } from '../database/generalOperations.js';
import { mediaItemValidator, newMediaItemValidator } from '../common/validation.js';
/**
 * @api {get} /api/allMediaItems Get All MediaItems (Admin only)
 * @apiName getAllMediaItems
 * @apiGroup mediaItemController
 * @apiDescription Populates media items view
 * @apiPermission admin
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiSuccess {Object[]} allMediaItems All media items.
 * @apiError notAuthorized Requesting user is not admin.
 */
const getAllMediaItems = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allMediaItems = yield models.MediaItem.findAll();
        return res.status(200).json({
            success: true,
            msg: 'fetchingSuccessful',
            allMediaItems
        });
    }
    catch (error) {
        logger.log('error', error);
        return res.status(500).json({
            success: false,
            msg: 'error'
        });
    }
});
/**
 * @api {post} /api/mediaItem Create MediaItem
 * @apiName createMediaItem
 * @apiGroup mediaItemController
 * @apiDescription Create a new MediaItem and add it to corresponding party. Only applies to non-file media items.
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {String} mediaItem New MediaItem.
 * @apiParam {String} partyId Party ID.
 * @apiError notAuthorized Requesting user is not admin or party is not active.
 */
const createMediaItem = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const newMediaItem = req.body.mediaItem;
    if (newMediaItemValidator.validate(newMediaItem).error) {
        logger.log('info', `Validation error while creating mediaItem: ${JSON.stringify(newMediaItemValidator.validate(newMediaItem).error)}`);
        return res.status(400).json({ success: false, msg: 'validationError' });
    }
    const insertSuccessful = yield insertNewMediaItem(req, newMediaItem, models, logger);
    if (insertSuccessful) {
        return res
            .status(200)
            .json({ success: true, msg: 'mediaItemAddSuccessful' });
    }
    else {
        return res.status(403).json({ success: false, msg: 'notAuthorized' });
    }
});
/**
 * @api {put} /api/mediaItem/:id Edit MediaItem
 * @apiName editMediaItem
 * @apiGroup mediaItemController
 * @apiDescription Edit a mediaItem (name only atm)
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {String} id MediaItem ID.
 * @apiError notAuthorized Requesting user is not admin or party is not active.
 */
const editMediaItem = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const editedMediaItem = req.body;
    const requestUser = req.user;
    if (mediaItemValidator.validate(editedMediaItem).error) {
        logger.log('info', `Validation error while creating mediaItem: ${JSON.stringify(mediaItemValidator.validate(editedMediaItem).error)}`);
        return res.status(400).json({ success: false, msg: 'validationError' });
    }
    if (!requestUser) {
        return res
            .status(400)
            .json({ success: false, msg: 'authenticationError' }); // FIXME Is this the way we do it?
    }
    const dbMediaItem = yield models.MediaItem.findOne({
        where: {
            id
        }
    });
    if (dbMediaItem.owner === requestUser.id || requestUser.role === 'admin') {
        dbMediaItem.name = editedMediaItem.name;
        dbMediaItem.save();
        return res
            .status(200)
            .json({ success: true, msg: 'mediaItemEditSuccessful' });
    }
    else {
        return res.status(403).json({ success: false, msg: 'notAuthorized' });
    }
});
/**
 * @api {delete} /api/mediaItem/:id Delete MediaItem
 * @apiName deleteMediaItem
 * @apiGroup mediaItemController
 * @apiDescription Delete a mediaItem. Users can only delete their items, admin can delete every item
 * @apiPermission user
 * @apiHeader {String} cookie Express session cookie 'connect.sid' (checked by passport.js middleware)
 * @apiParam {String} id MediaItem ID.
 * @apiError notAuthorized Requesting user is not admin or party is not active.
 */
const deleteMediaItem = (req, res, models, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const requestUser = req.user;
    if (!requestUser) {
        return res
            .status(400)
            .json({ success: false, msg: 'authenticationError' }); // FIXME Is this the way we do it?
    }
    const mediaItemId = req.params.id;
    try {
        const item = yield models.MediaItem.findOne({
            where: {
                id: mediaItemId
            }
        });
        if (item.owner === requestUser.id || requestUser.role === 'admin') {
            if (item.type === 'file') {
                fs.unlinkSync(path.join(path.resolve('uploads'), item.url));
            }
            item.destroy();
            return res.status(200).json({
                success: true,
                msg: 'mediaItemDeleteSuccessful'
            });
        }
        else {
            return res
                .status(403)
                .json({ success: false, msg: 'notAuthorized' });
        }
    }
    catch (error) {
        logger.log('error', error);
        return res.status(500).json({ success: false, msg: 'error' });
    }
});
export default {
    getAllMediaItems,
    createMediaItem,
    editMediaItem,
    deleteMediaItem
};
