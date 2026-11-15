import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function key() {
  const k = Buffer.from(process.env.TOKEN_ENC_KEY ?? "", "base64");
  if (k.length !== 32) throw new Error("TOKEN_ENC_KEY invalide (32 octets en base64 requis)");
  return k;
}
export function encrypt(text: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decrypt(s: string) {
  const [iv, tag, enc] = s.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
