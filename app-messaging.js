var cluster = require('cluster');
var numberOfChildProcesses = 2;

cluster.on('exit', function(worker, code, signal) {
	console.log('worker %s has exited', worker.process.pid);
});

var messageCounter = 0;
if (cluster.isMaster) {
	for (var i = 0; i < numberOfChildProcesses; i++) {
		console.log("master %s creating child process %d using cluster.fork ", process.pid, i);
		var worker = cluster.fork();
		console.log('master %s requested start for worker %s', process.pid, worker.process.pid);

		registerToSendMessageOnInterval(worker);

		if (i === 0) {
			registerToSendKillMessage(worker);
		}
	}
} else if (cluster.isWorker) {
	var worker = cluster.worker;

	console.log('starting worker %s', worker.process.pid);

	worker.on('message', function(message) {
		if (message.m) {
			console.log('[%s] received message %s', process.pid, message.m);
		} else if (message.die == 'true') {
			console.log('worker %s received message instructing to shutdown', process.pid);
			worker.kill();
		}
	});
}

function registerToSendMessageOnInterval(recipient) {
	console.log('registering for [%s] to send message to %s', process.pid, recipient.process.pid);

	var intervalRef = setInterval(function() {
		var message = {
			'm': messageCounter++
		};
		console.log('[%s] sending message %s to %s', process.pid, message.m, recipient.process.pid);
		try {
			recipient.send(message);
		} catch (err) {
			console.log('failed to send message ' + err);
			unregister();
		}
	}, 5000);

	function unregister() {
		clearInterval(intervalRef);
	}
}

function registerToSendKillMessage(recipient) {
	console.log('registering for [%s] to send kill message to %s', process.pid, recipient.process.pid);

	var interval = setInterval(function() {
		var message = {
			'die': 'true'
		};
		console.log('[%s] sending kill message %s to %s', process.pid, message.m, recipient.process.pid);

		try {
			recipient.send(message);
		} catch (err) {
			console.log('failed to send message ' + err);
		}
	}, 30000);
};