import crypto from "node:crypto";
import fs from "node:fs";

export async function sha256File(filePath: string) {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);

  let size = 0;
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk) => {
      const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      size += buf.length;
      hash.update(buf);
    });
    stream.on("error", reject);
    stream.on("end", () => resolve());
  });

  return { sha256: hash.digest("hex"), size };
}



