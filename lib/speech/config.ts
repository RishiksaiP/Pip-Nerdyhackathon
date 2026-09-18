export function speechUrl() {
  const url = new URL(process.env.LOCAL_STT_URL || "http://127.0.0.1:8178");
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
    throw new Error("Speech server must use a loopback address");
  return url.origin;
}
