import express, { Router } from 'express';
import { generateJwt } from 'src/auth';
import userManager from 'src/user-manager';

const router = Router();
router.use(express.json());

type PostParams = {
	username?: string;
	password?: string;
};
router.post<{}, {}, PostParams>('/', async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(401).send();
	}

	const passwordHash = await userManager.hashPassword(password);

	const [user] = await userManager.getUsers(
		u => u.username === username && u.passwordHash === passwordHash
	);

	if (!user) {
		return res.status(404).send();
	}

	const jwt = generateJwt(user);

	res.cookie('jwt', jwt, {
		maxAge: 7200000,
	});

	res.send(jwt);
});

export default router;
