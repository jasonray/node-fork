var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
// var process = require('process');

l("starting application");

if (cluster.isMaster) {
	l("starting master");
	l("# of cpu: " + numCPUs);
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		l("forking" + i);
		cluster.fork();
	}

	cluster.on('exit', function(worker, code, signal) {
		l("worker " + worker.process.pid + " has died [code=" + code + "][signal=" + signal + "]");

		l('will restart worker in 1 second');
		setTimeout(function() {
			l("restarting worker");
			cluster.fork();
		}, 1000);
	});
	cluster.on('online', function(worker) {
		l('worker ' + worker.process.pid + ' is now online');
	})
} else if (cluster.isWorker) {
	var randomId = Math.floor((Math.random() * 1000) + 1);
	l("starting worker " + randomId);

	var iT = 0;
	var iI = 0;

	setTimeout(function() {
		iT = iT + 1;
		l("timer fired " + iT);
	}, 10000);

	setInterval(function() {
		iI = iI + 1;
		l("interval fired " + iI);
	}, 10000);
} else {
	l("not a master, not a worker??");
}

function l(message) {
	console.log("[" + process.pid + "] " + message);
}