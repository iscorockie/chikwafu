import mongoose from "mongoose";

/**
 * Clean up a pasted connection string.
 *
 * Dashboard env-var fields are textareas, so a copied URI often arrives with
 * a trailing newline, stray spaces or wrapping quotes. Mongo then fails with
 * an opaque message like `option  is not supported`, which says nothing about
 * whitespace. Strip the noise before we ever hand it to the driver.
 */
export const sanitizeMongoUri = (raw) => {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\u00a0/g, " ")   // non-breaking spaces, common when copying from docs
    .trim()
    .replace(/^["']|["']$/g, "") // wrapping quotes
    .replace(/\s+/g, "");        // any internal whitespace, incl. a wrapped line
};

/**
 * Explain, in plain terms, why a connection string won't work.
 * Returns an array of problems; empty means it looks usable.
 */
export const diagnoseMongoUri = (uri) => {
  const problems = [];

  if (!uri) {
    problems.push("MONGO_URI is not set. Add it in your host's environment settings.");
    return problems;
  }

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    problems.push(`It must start with "mongodb+srv://" or "mongodb://" — got "${uri.slice(0, 24)}…".`);
    return problems;
  }

  if (uri.includes("<password>") || uri.includes("<db_password>")) {
    problems.push('The "<password>" placeholder is still in the string — replace it with the real password.');
  }

  if (/xxxxx|<cluster>|your-cluster/i.test(uri)) {
    problems.push('The cluster hostname is still a placeholder. Copy the real one from Atlas → Connect → Drivers.');
  }

  // Database name must sit between the host and the "?", not inside the query.
  const afterHost = uri.replace(/^mongodb(\+srv)?:\/\/[^/]+/, "");
  const [path = "", query = ""] = afterHost.split("?");
  const dbName = path.replace(/^\//, "");

  if (!dbName) {
    problems.push(
      'No database name. Mongo will default to "test" and your data will look missing — ' +
      'insert it before the "?", e.g. ...mongodb.net/chikwafu?retryWrites=true',
    );
  }

  if (query) {
    for (const pair of query.split("&")) {
      if (pair === "") {
        problems.push('There is an empty option in the query string — look for a stray "&" or "&&".');
        continue;
      }
      const key = pair.split("=")[0];
      if (key.startsWith("/")) {
        problems.push(
          `"${key}" appears after the "?", so Mongo reads it as an option. ` +
          "The database name belongs before the \"?\".",
        );
      }
    }
  }

  // Credentials present but unescaped reserved characters will break auth.
  // Greedy up to the LAST "@" — an unescaped "@" inside the password would
  // otherwise hide itself by terminating the match early.
  const creds = uri.match(/^mongodb(\+srv)?:\/\/(.*)@[^@]*$/);
  if (creds) {
    const [user = "", ...rest] = creds[2].split(":");
    const pass = rest.join(":");
    if (/[@/?#[\]]/.test(user) || /[@/?#[\]]/.test(pass)) {
      problems.push(
        "The username or password contains a reserved character (@ / ? # [ ]). " +
        "Percent-encode it: @ becomes %40, # becomes %23, / becomes %2F.",
      );
    }
  }

  return problems;
};

/**
 * Live connection state, for /api/health to report on.
 *
 * mongoose.connection.readyState is the source of truth; we add the last
 * error so an operator can see *why* it is down without opening the logs.
 */
const READY_STATE = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

let lastError = null;

export const dbStatus = () => {
  const state = READY_STATE[mongoose.connection.readyState] ?? "unknown";
  return {
    state,
    ok: mongoose.connection.readyState === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    lastError: state === "connected" ? null : lastError,
  };
};

/** Keep the recorded error in step with reconnects. */
mongoose.connection.on("connected", () => { lastError = null; });
mongoose.connection.on("error", (e) => { lastError = e?.message?.split("\n")[0] ?? String(e); });
mongoose.connection.on("disconnected", () => {
  if (!lastError) lastError = "connection lost";
});

const connectDB = async () => {
  const raw = process.env.MONGO_URI;
  const uri = sanitizeMongoUri(raw);

  if (raw && raw !== uri) {
    console.warn("MONGO_URI had surrounding whitespace or quotes — trimmed automatically.");
  }

  const problems = diagnoseMongoUri(uri);
  if (problems.length) {
    console.error("\nCannot connect to MongoDB — the connection string looks wrong:\n");
    problems.forEach((p) => console.error(`  • ${p}`));
    console.error(
      "\nExpected shape:\n" +
      "  mongodb+srv://USER:PASSWORD@cluster0.abcde.mongodb.net/chikwafu?retryWrites=true&w=majority\n",
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    const msg = err.message || String(err);
    console.error(`\nMongoDB connection error: ${msg}\n`);

    // Turn the driver's terse errors into something actionable.
    if (/querySrv ENOTFOUND|getaddrinfo ENOTFOUND/i.test(msg)) {
      console.error(
        "  • That cluster hostname does not resolve. Check it against\n" +
        "    Atlas → Connect → Drivers; the shard id (e.g. \"abcde\") is unique to your cluster.",
      );
    } else if (/bad auth|Authentication failed/i.test(msg)) {
      console.error(
        "  • The username or password was rejected. Confirm the database user in\n" +
        "    Atlas → Database Access, and percent-encode any @ / ? # in the password.",
      );
    } else if (/IP that isn'?t whitelisted|not allowed to access|ETIMEDOUT|ECONNREFUSED/i.test(msg)) {
      console.error(
        "  • The cluster refused the connection. In Atlas → Network Access, allow this\n" +
        "    host's IP. Render's free tier has no fixed outbound IP, so it needs 0.0.0.0/0.",
      );
    }
    console.error("");

    // Do NOT exit. The driver keeps retrying in the background, and staying
    // up lets /api/health report the outage honestly — a crash loop just
    // hides the cause and makes the platform think it is still starting.
    lastError = msg.split("\n")[0];
    return false;
  }
};

export default connectDB;
