const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { PATH_CLIENT } = require('./consts');
const { PASSWORD } = require('./config');
const { log } = require('./logger');

function rawBody(req, res, next) {
	req.setEncoding('utf8');
	req.rawBody = '';
	req.on('data', function(chunk) {
		req.rawBody += chunk;
	});
	req.on('end', function(){
		try { if(req.rawBody) req.body = JSON.parse(req.rawBody) } catch(e) { log(e); }
		
		next();
	});
}

const applyMiddleware = (app, io) => {
	app.use(rawBody);
	
	app.use((req, res, next) => {
		req.cid = uuidv4().toUpperCase();
	
		log(`${req.ip} -> ${req.method} ${req.originalUrl}`, req);
		
		res.removeHeader('X-Powered-By');
		
		next();
	});

	app.use((req, res, next) => {
		res.io = io;

		next();
	});
	
	app.use((req, res, next) => {
		const { ip, method } = req;
		
		const isClientLocal = ip.match(/192\.168\.1/);
	
		if (isClientLocal) { 
			res.set('X-Authenticated', 'true')
			res.set('Access-Control-Allow-Headers', '*');
			res.set('Access-Control-Allow-Origin', '*');
			res.set('Access-Control-Allow-Methods', '*');
			req.isAuthenticated = true;
		} else {
			const pass = req.header('pass');
			req.isAuthenticated = pass === PASSWORD;
		}
		
		switch(method.toUpperCase()) {
			case 'DELETE':
			case 'PATCH':
			case 'POST':
			case 'PUT':
				if (isClientLocal) {
					next();
				} else {
					return res.status(404).send();
				}
				break;
			default:
				next();
		}
	});
	
	app.use((req, res, next) => {
		const authPatterns = [
			'/api/snapshots/*',
			'/api/config*',
		];
	
		const { isAuthenticated, originalUrl } = req;
	
		if (authPatterns.some(pattern => new RegExp(pattern).exec(originalUrl)) && !isAuthenticated) {
			return res.status(404).send();
		}
	
		next();
	});
	
	app.use(express.static(PATH_CLIENT));

	log('Applied custom middleware');
};

const applyFinalMiddleware = app => {
	app.use((err, req, res, next) => {
		log(`Encountered unexpected error: ${err.stack}`, req);
		res.status(500).send();
	});
};

module.exports = { applyFinalMiddleware, applyMiddleware };
