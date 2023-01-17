import express from 'express';
import router from './router';
import cors from 'cors';

const app = express();

app.use(
	cors({
		credentials: true,
		origin: (origin, callback) => {
			if (!origin) {
				return callback(null, true);
			}
			const allowedDomains = [
				'http://gramont.ddns.net',
				'http://gramont.ddns.net:5173',
			];
			if (allowedDomains.includes(origin)) {
				return callback(null, true);
			} else {
				return callback(new Error('Origin not allowed'), false);
			}
		},
	})
);

app.use('/', router);

app.listen(7777);
