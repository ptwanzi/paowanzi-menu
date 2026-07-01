const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const collection = db.collection('submissions');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

function normalizePath(event) {
  return event.path || event.requestContext?.path || '/';
}

function normalizeAction(event) {
  const query = event.queryStringParameters || {};
  if (query.action) return query.action;
  const path = normalizePath(event);
  if (path.endsWith('/submit')) return 'submit';
  if (path.endsWith('/submissions')) return 'submissions';
  return '';
}

function parseBody(event) {
  if (!event.body) return {};
  if (typeof event.body === 'object') return event.body;
  try {
    return JSON.parse(event.body);
  } catch (error) {
    return {};
  }
}

exports.main = async (event) => {
  const method = event.httpMethod || event.requestContext?.httpMethod || 'GET';
  const action = normalizeAction(event);

  if (method === 'OPTIONS') {
    return response(204, { ok: true });
  }

  if (method === 'POST' && action === 'submit') {
    const body = parseBody(event);
    const choices = Array.isArray(body.choices) ? body.choices.slice(0, 5) : [];

    if (!body.name || choices.length !== 5) {
      return response(400, { ok: false, error: '名字和 5 道选择为必填。' });
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
      user_agent: event.headers?.['user-agent'] || event.headers?.['User-Agent'] || ''
    };

    const result = await collection.add({ data: record });
    return response(200, { ok: true, id: result._id });
  }

  if (method === 'GET' && action === 'submissions') {
    const result = await collection.orderBy('submitted_at', 'desc').limit(200).get();
    return response(200, { ok: true, data: result.data || [] });
  }

  return response(404, { ok: false, error: '接口不存在。' });
};
