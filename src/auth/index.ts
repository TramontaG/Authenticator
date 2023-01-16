import jwt, { Algorithm } from 'jsonwebtoken';
import fs from 'fs';
import { Permission } from 'src/db/schema';
import { WithoutId } from 'src/user-manager';
import express, { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';

const privateKEY = fs.readFileSync('./keys/keys2.key', 'utf8');
const publicKEY = fs.readFileSync('./keys/keys2.pub', 'utf8');

const issuer = 'Gramont-Software';
const audience = 'http://gramont.ddns.net';
const subject = 'authentication';
const expiresIn = '2h';
const algorithm: Algorithm = 'RS512';

const signOptions = {
	issuer,
	subject,
	audience,
	expiresIn,
	algorithm,
};

const verifyOptions = {
	issuer,
	subject,
	audience,
	expiresIn,
	algorithm: [algorithm],
};

type UserCredentials = WithoutId<'user'>;

type JWTPayload = UserCredentials & {
	seed: string;
};

export const generateJwt = (credentials: UserCredentials) => {
	return jwt.sign(
		{
			...credentials,
			seed: Math.random().toString(),
		},
		privateKEY,
		signOptions
	);
};

export const verifyJwt = (token: string) => {
	return jwt.verify(token, publicKEY, verifyOptions) as JWTPayload;
};

export const hasAllPermissions = (
	requestedPerms: Permission[],
	userPerms: Permission[]
) => requestedPerms.every(perm => userPerms.includes(perm));

export const useJWT = (perms: Permission[]): RequestHandler[] => {
	const jwtMiddleware: RequestHandler = (req, res, next) => {
		try {
			let jwt = req.get('jwt') || req.cookies.jwt;

			const { dateAdded, dateRemoved, passwordHash, permissions, username } =
				verifyJwt(jwt);

			if (!hasAllPermissions(perms, permissions)) {
				return res.status(401).send();
			}

			const newJwt = generateJwt({
				dateAdded,
				dateRemoved,
				passwordHash,
				permissions,
				username,
			});

			res.cookie('jwt', newJwt, {
				maxAge: 7200000,
			});
			next();
		} catch (e) {
			res.status(403).send();
		}
	};

	return [express.json(), cookieParser(), jwtMiddleware];
};
