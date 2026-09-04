import { createHash } from "crypto";

export type LiveJournalConfig = {
  username: string;
  password: string;
};

const ENDPOINT = "https://www.livejournal.com/interface/xmlrpc";

function md5Hex(value: string) {
  return createHash("md5").update(value, "utf8").digest("hex");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function encodeValue(value: string | number): string {
  if (typeof value === "number") {
    return `<value><int>${value}</int></value>`;
  }
  return `<value><string>${escapeXml(value)}</string></value>`;
}

function buildStruct(fields: Record<string, string | number>) {
  return Object.entries(fields)
    .map(
      ([name, value]) =>
        `<member><name>${escapeXml(name)}</name>${encodeValue(value)}</member>`,
    )
    .join("");
}

function buildMethodCall(
  method: string,
  fields?: Record<string, string | number>,
) {
  const params = fields
    ? `<params><param><value><struct>${buildStruct(fields)}</struct></value></param></params>`
    : `<params></params>`;

  return `<?xml version="1.0"?><methodCall><methodName>${method}</methodName>${params}</methodCall>`;
}

function extractMemberValue(xml: string, name: string) {
  const member = xml.match(
    new RegExp(
      `<name>${name}<\\/name>\\s*<value>(?:<(?:string|int|i4)>)?([\\s\\S]*?)(?:<\\/(?:string|int|i4)>)?<\\/value>`,
      "i",
    ),
  );
  if (!member?.[1]) return "";
  return member[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .trim();
}

function extractString(xml: string, name: string) {
  return extractMemberValue(xml, name);
}

function extractFault(xml: string) {
  if (!/<fault>/i.test(xml)) return null;
  const code = extractMemberValue(xml, "faultCode");
  const string =
    extractMemberValue(xml, "faultString") || "LiveJournal request failed.";
  return code ? `${string} (${code})` : string;
}

async function xmlrpcCall(
  method: string,
  fields?: Record<string, string | number>,
) {
  const body = buildMethodCall(method, fields);
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
      "User-Agent": "GrowthPilot/1.0",
    },
    body,
  });

  const xml = await response.text();
  if (!response.ok) {
    throw new Error(`LiveJournal HTTP error (${response.status})`);
  }

  const fault = extractFault(xml);
  if (fault) {
    throw new Error(fault);
  }

  return xml;
}

async function withChallengeAuth(
  config: LiveJournalConfig,
  extra: Record<string, string | number> = {},
) {
  const challengeXml = await xmlrpcCall("LJ.XMLRPC.getchallenge");
  const challenge = extractString(challengeXml, "challenge");
  if (!challenge) {
    throw new Error("Could not get LiveJournal auth challenge.");
  }

  const authResponse = md5Hex(challenge + md5Hex(config.password));

  return {
    username: config.username.trim(),
    auth_method: "challenge",
    auth_challenge: challenge,
    auth_response: authResponse,
    ver: 1,
    ...extra,
  };
}

export async function testLiveJournalConnection(config: LiveJournalConfig) {
  const fields = await withChallengeAuth(config, {
    clientversion: "GrowthPilot/1.0",
    getmoods: 0,
    getmenus: 0,
    getpickws: 0,
    getpickwurls: 0,
  });
  const xml = await xmlrpcCall("LJ.XMLRPC.login", fields);
  const fullname = extractString(xml, "fullname") || config.username;
  const userid = extractString(xml, "userid");

  return {
    username: config.username.trim(),
    fullname,
    userid,
    profileUrl: `https://${config.username.trim()}.livejournal.com/`,
  };
}

export async function publishToLiveJournal(
  config: LiveJournalConfig,
  input: { title: string; body: string; targetUrl?: string },
) {
  const now = new Date();
  const event = [
    input.body.trim(),
    input.targetUrl?.trim() ? `\n\n${input.targetUrl.trim()}` : "",
  ]
    .join("")
    .trim();

  const fields = await withChallengeAuth(config, {
    subject: input.title.trim(),
    event,
    lineendings: "unix",
    year: now.getUTCFullYear(),
    mon: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    hour: now.getUTCHours(),
    min: now.getUTCMinutes(),
  });

  const xml = await xmlrpcCall("LJ.XMLRPC.postevent", fields);
  const url = extractString(xml, "url");
  const itemid = extractString(xml, "itemid");
  const anum = extractString(xml, "anum");

  return {
    itemid,
    anum,
    url:
      url ||
      `https://${config.username.trim()}.livejournal.com/`,
  };
}
