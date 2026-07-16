import express from 'express';
import { getAllUsers, getUser, loginUser, myProfile, verifyUser,updateName  } from '../controllers/user.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/verify', verifyUser);
router.get('/me',isAuth, myProfile);
router.get('/user/all', getAllUsers);
router.get('/user/:id', getUser);
router.post('/update/user', isAuth, updateName);

export default router;