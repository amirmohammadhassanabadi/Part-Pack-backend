const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const root = path.resolve(__dirname, "..");
const local = path.join(root, ".local");
const action = process.argv[2] || "start";

function running(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
  });
}
async function waitFor(port) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await running(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Service on port ${port} did not start; check .local/logs`);
}
async function start() {
  for (const dir of ["data/mongo", "data/redis", "logs"]) fs.mkdirSync(path.join(local, dir), { recursive: true });
  const services = [
    { name: "mongo", port: 27017, binary: "mongod", args: ["--bind_ip", "127.0.0.1", "--port", "27017", "--replSet", "rs0", "--dbpath", path.join(local, "data/mongo"), "--logpath", path.join(local, "logs/mongo.log")] },
    { name: "redis", port: 6379, binary: "redis-server", args: ["--bind", "127.0.0.1", "--port", "6379", "--dir", path.join(local, "data/redis"), "--appendonly", "yes", "--logfile", path.join(local, "logs/redis.log")] },
  ];
  for (const service of services) {
    if (await running(service.port)) {
      const pidFile = path.join(local, `${service.name}.pid`);
      const pid = fs.existsSync(pidFile) ? Number(fs.readFileSync(pidFile, "utf8")) : 0;
      const expected = path.join(local, "bin", service.binary);
      const actual = pid && fs.existsSync(`/proc/${pid}/exe`) ? fs.realpathSync(`/proc/${pid}/exe`) : "";
      if (actual !== expected) throw new Error(`Port ${service.port} is used by an unmanaged service; refusing to modify it`);
    } else {
      const binary = path.join(local, "bin", service.binary);
      if (!fs.existsSync(binary)) throw new Error(`Install ${service.binary} in .local/bin first`);
      const log = fs.openSync(path.join(local, "logs", `${service.name}-startup.log`), "a");
      const child = spawn(binary, service.args, { detached: true, stdio: ["ignore", log, log] });
      child.on("error", (error) => console.error(error.message));
      child.unref();
      fs.closeSync(log);
      fs.writeFileSync(path.join(local, `${service.name}.pid`), String(child.pid));
      await waitFor(service.port);
    }
  }
  await mongoose.connect("mongodb://127.0.0.1:27017/admin?directConnection=true", { serverSelectionTimeoutMS: 10000 });
  const admin = mongoose.connection.db.admin();
  try {
    const config = await admin.command({ replSetGetConfig: 1 });
    if (config.config._id !== "rs0") throw new Error("Unexpected replica set; refusing to modify it");
  } catch (error) {
    if (error.code !== 94) throw error;
    await admin.command({ replSetInitiate: { _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] } });
  }
  let primaryReady = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if ((await admin.command({ hello: 1 })).isWritablePrimary) { primaryReady = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!primaryReady) throw new Error("MongoDB replica set is not writable yet");
  await mongoose.disconnect();
  const redis = new Redis("redis://127.0.0.1:6379");
  console.log(`MongoDB rs0 ready; Redis: ${await redis.ping()}`);
  await redis.quit();
}
async function stop() {
  for (const name of ["redis", "mongo"]) {
    const file = path.join(local, `${name}.pid`);
    if (!fs.existsSync(file)) continue;
    const pid = Number(fs.readFileSync(file, "utf8"));
    const executable = fs.existsSync(`/proc/${pid}/exe`) ? fs.realpathSync(`/proc/${pid}/exe`) : "";
    if (executable.startsWith(path.join(local, "bin") + path.sep)) process.kill(pid, "SIGTERM");
    else if (executable) throw new Error(`PID ${pid} is not a project service; refusing to stop it`);
    fs.unlinkSync(file);
  }
  console.log("Local services stopped; data retained in .local/data");
}
(async () => {
  if (action === "start") await start();
  else if (action === "stop") await stop();
  else throw new Error("Use start or stop");
})().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exitCode = 1; });
