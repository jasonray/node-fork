var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var util = require('util');
var process = require('process');

process.on('exit', function(code) {
	l('process about to exit ' + code);
});

if (cluster.isMaster) {
	//cluster.isMaster documentation = http://nodejs.org/docs/latest/api/cluster.html#cluster_cluster_ismaster
	l("starting master process");
	logProcessInfo(process);
	l("# of cpu: " + numCPUs);

	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		l("creating child process %d using cluster.fork ", i);
		cluster.fork();
	}

	//register exit event, allowing us to automatically restart child process
	cluster.on('exit', function(worker, code, signal) {
		l("worker " + worker.process.pid + " has died [code=" + code + "][signal=" + signal + "]");

		l('will restart worker in 1 second');
		setTimeout(function() {
			l("restarting worker");
			cluster.fork();
		}, 1000);
	});

	//register online, not sure what the purpose of this will be, but I want to see when this will fire
	cluster.on('online', function(worker) {
		l('worker ' + worker.process.pid + ' is now online');
	});

	//every 10 seconds, have the master report what processes it thinks it is running
	setInterval(function() {
		//check on workers
		for (var id in cluster.workers) {
			var worker = cluster.workers[id];
			l("check on worker " + id + "; pid " + worker.process.pid);
		}
	}, 10000);
} else if (cluster.isWorker) {
	//cluster.isWorker documentation = http://nodejs.org/docs/latest/api/cluster.html#cluster_cluster_isworker
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
	}, 1000);

	setInterval(function() {
		logMemoryUsage(process);
	}, 5000);

	setInterval(function() {
		runExpensiveOperation();
	}, 30000);
} else {
	l("not a master, not a worker??");
}

function l(message) {
	console.log("[" + process.pid + "] " + message);
}

function logProcessInfo(p) {
	// documentation on the process object: http://nodejs.org/api/process.html
	l('pid: ' + p.pid);
	l('argv: ' + p.argv);
	l('execPath: ' + p.execPath);
	l('execArgv: ' + p.execArgv);
	l('version: ' + p.version);
	l('versions: ' + p.versions);
	l('config: ' + p.config);
	l('title: ' + p.title);
	l('platform: ' + p.platform);
	l('uptime: ' + p.uptime());
}

function logMemoryUsage(p) {
	l("memory for " + p.pid + ": " + util.inspect(p.memoryUsage()));
}

function runExpensiveOperation() {
	l('start expensive operation');
	for (var j = 0; j < 30; j++) {
		var a = [];
		for (var i = 0; i < 10000000; i++) {
			a.push(i);
		}
	}
	l('end expensive operation');
}