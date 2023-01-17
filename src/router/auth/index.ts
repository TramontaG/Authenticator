import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import { generateJwt, hasAllPermissions, verifyJwt } from 'src/auth';
import { Permission } from 'src/db/schema';
import userManager from 'src/user-manager';

const router = Router();
router.use(express.json());
router.use(cookieParser());

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

type JwtAuthParams = {
	perms?: Permission[];
	jwt?: string;
};
router.post<{}, {}, JwtAuthParams>('/jwt', async (req, res) => {
	try {
		const jwt = req.body.jwt || req.cookies.jwt;
		const requestedPerms = req.body.perms;

		const { dateAdded, dateRemoved, passwordHash, permissions, username } =
			verifyJwt(jwt);

		if (!requestedPerms) {
			return res.status(402).send();
		}

		if (!hasAllPermissions(requestedPerms, permissions)) {
			return res.status(401).send();
		}

		const newJwt = generateJwt({
			dateAdded,
			dateRemoved,
			passwordHash,
			permissions,
			username,
		});

		res
			.cookie('jwt', newJwt, {
				maxAge: 7200000,
			})
			.send('ok');
	} catch (e) {
		res.status(403).send();
	}
});

export default router;
