const http = require('http');
const url = require('url');
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

const db = app.database();
const collection = db.collection('submissions');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function send(res, statusCode, body) {
  res.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function normalizeAction(reqUrl) {
  const parsed = url.parse(reqUrl, true);
  if (parsed.query.action) return parsed.query.action;
  if (parsed.pathname.endsWith('/submit')) return 'submit';
  if (parsed.pathname.endsWith('/submissions')) return 'submissions';
  return '';
}

async function handleSubmit(req, res) {
  const body = await readBody(req);
  const choices = Array.isArray(body.choices) ? body.choices.slice(0, 5) : [];

  if (!body.name || choices.length !== 5) {
    send(res, 400, { ok: false, error: '名字和 5 道选择为必填。' });
    return;
  }

  const record = {
    name: String(body.name || '').slice(0, 60),
    role: String(body.role || '').slice(0, 120),
    challenge: String(body.challenge || '').slice(0, 400),
    choice_1: choices[0]?.title || '',
    choice_2: choices[1]?.title || '',
    choice_3: choices[2]?.title || '',
    choice_4: choices[3]?.title || '',
    choice_5: choices[4]?.title || '',
    custom_topic: String(body.custom_topic || '').slice(0, 300),
    choices,
    submitted_at: new Date(),
    user_agent: req.headers['user-agent'] || ''
  };

  const result = await collection.add(record);
  send(res, 200, { ok: true, id: result.id || result._id });
}

async function handleList(res) {
  const result = await collection.orderBy('submitted_at', 'desc').limit(200).get();
  send(res, 200, { ok: true, data: result.data || [] });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      send(res, 204, { ok: true });
      return;
    }

    const action = normalizeAction(req.url);

    if (req.method === 'POST' && action === 'submit') {
      await handleSubmit(req, res);
      return;
    }

    if (req.method === 'GET' && action === 'submissions') {
      await handleList(res);
      return;
    }

    send(res, 404, { ok: false, error: '接口不存在。' });
  } catch (error) {
    console.error(error);
    send(res, 500, { ok: false, error: error.message || '服务异常。' });
  }
});

const port = Number(process.env.PORT || 9000);
server.listen(port, () => {
  console.log(`paowanzi-menu-api listening on ${port}`);
});
