import express, { Router } from 'express';
import { useJWT } from 'src/auth';
import { Permission } from 'src/db/schema';
import userManager from 'src/user-manager';

const router = Router();
router.use(express.json());
router.use(useJWT(['image', 'user-management']));

type GetUserParams = {
	username?: string;
};
router.get<{}, {}, {}, GetUserParams>('/', (req, res) => {
	const { username } = req.query;
	if (!username) {
		return res.status(402).send('invalid username');
	}

	userManager.getUserByUsername(username).then(([user]) => {
		res.send({
			...user,
			dateAdded: new Date(user.dateAdded),
			dateRemoved: user.dateRemoved ? new Date(user.dateRemoved) : null,
		});
	});
});

type PostUserParams = {
	username?: string;
	password?: string;
	permissions?: Permission[];
};
router.post<{}, {}, PostUserParams>('/', async (req, res) => {
	const { username, password, permissions } = req.body;

	if (!username || !password || !permissions) {
		return res.status(402).send('bad request');
	}

	if (
		typeof username !== 'string' ||
		typeof password !== 'string' ||
		!Array.isArray(permissions) ||
		!!permissions.find(p => typeof p !== 'string')
	) {
		return res.status(402).send('bad request');
	}

	const passwordHash = await userManager.hashPassword(password);

	userManager.insertUser({
		username,
		passwordHash,
		permissions,
		dateAdded: new Date().getTime(),
		dateRemoved: null,
	});

	res.send('ok');
});

type DeleteUserParams = {
	username?: string;
};
router.delete<{}, {}, DeleteUserParams>('/', async (req, res) => {
	const { username } = req.body;

	if (!username) {
		return res.status(402).send('bad request');
	}

	const [user] = await userManager.getUserByUsername(username);

	if (!user) {
		return res.status(404).send();
	}

	await userManager.deleteUser(user.id);

	return res.send('ok');
});

export default router;
