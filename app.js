var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var util = require('util');
// var process = require('process');
var _ = require('underscore');
var http = require('http');

process.on('exit', function (code) {
    l('process about to exit ' + code);
});

if (cluster.isMaster) {
    startCluster(cluster);
} else if (cluster.isWorker) {
    startWorker(cluster);
} else {
    l("not a master, not a worker??");
}

function startCluster(cluster) {
    //cluster.isMaster documentation = http://nodejs.org/docs/latest/api/cluster.html#cluster_cluster_ismaster
    l("starting master process");
    logProcessInfo(process);
    l("# of cpu: " + numCPUs);

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        l("creating child process " + i + " using cluster.fork ");
        cluster.fork();
    }

    //register exit event, allowing us to automatically restart child process
    cluster.on('exit', function (worker, code, signal) {
        l("worker " + worker.process.pid + " has died [code=" + code + "][signal=" + signal + "]");

        l('will restart worker in 1 second');
        setTimeout(function () {
            l("restarting worker");
            cluster.fork();
        }, 1000);
    });

    //register online, not sure what the purpose of this will be, but I want to see when this will fire
    cluster.on('online', function (worker) {
        l('worker ' + worker.process.pid + ' is now online');
    });
}

var server;
var requestCount = 0;
function startWorker(cluster) {
    l("starting worker ");

    process.on('message', function (message) {
        l('received message ' + message.i);
    });

    server = startServer();
}

function startServer() {
    l('starting http server');
    var srv = http.createServer(function (req, res) {
        requestCount++;
        l('received http request [' + requestCount + ']');
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('okay');
    });
    srv.listen(8080, '127.0.0.1');
    return srv;
}

// i created this log wrapper simply so that I can add the process info to the message
function l(message) {
    console.log("[%s] %s", process.pid, message);
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
