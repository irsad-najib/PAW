/*
Admin notification test helper
Usage:
  ADMIN_TOKEN=<token> node test/test-admin-notifications.js complete <orderId>
  ADMIN_TOKEN=<token> node test/test-admin-notifications.js markPaid <orderId>
  ADMIN_TOKEN=<token> node test/test-admin-notifications.js batchComplete <id1,id2>
  ADMIN_TOKEN=<token> node test/test-admin-notifications.js groupMarkPaid <groupId>

This script will call admin endpoints and then verify order state via GET /api/orders/:id
It does NOT mock Fonnte; it will show Fonnte response from the server. Make sure backend is running.
*/

const axios = require("axios");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("ERROR: ADMIN_TOKEN env var is required");
  process.exit(2);
}

const cmd = process.argv[2];
const arg = process.argv[3];

if (!cmd || !arg) {
  console.error("Usage: node test/test-admin-notifications.js <command> <arg>");
  console.error(
    "Commands: complete <orderId>, markPaid <orderId>, batchComplete <id1,id2,...>, groupMarkPaid <groupId>"
  );
  process.exit(1);
}

async function markOrderComplete(orderId) {
  console.log(
    "PATCH /api/orders/" + orderId + '/status { orderStatus: "completed" }'
  );
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/orders/${orderId}/status`,
      { orderStatus: "completed" },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    console.log("Response:", res.status, res.data);
  } catch (err) {
    console.error(
      "Error:",
      err.response?.status,
      err.response?.data || err.message
    );
  }

  await fetchOrder(orderId);
}

async function markOrderPaid(orderId) {
  console.log(
    "PATCH /api/orders/" + orderId + '/payment { action: "markPaid" }'
  );
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/orders/${orderId}/payment`,
      { action: "markPaid" },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    console.log("Response:", res.status, res.data);
  } catch (err) {
    console.error(
      "Error:",
      err.response?.status,
      err.response?.data || err.message
    );
  }

  await fetchOrder(orderId);
}

async function batchComplete(idsCsv) {
  const ids = idsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  console.log(
    'PATCH /api/orders/batch/status { orderIds: [...], orderStatus: "completed" }'
  );
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/orders/batch/status`,
      { orderIds: ids, orderStatus: "completed" },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    console.log("Response:", res.status, res.data);
  } catch (err) {
    console.error(
      "Error:",
      err.response?.status,
      err.response?.data || err.message
    );
  }

  for (const id of ids) await fetchOrder(id);
}

async function groupMarkPaid(groupId) {
  console.log(
    "PATCH /api/orders/group/" + groupId + '/payment { action: "markPaid" }'
  );
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/orders/group/${groupId}/payment`,
      { action: "markPaid" },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );
    console.log("Response:", res.status, JSON.stringify(res.data, null, 2));
    if (res.data && res.data.orders) {
      for (const o of res.data.orders) await fetchOrder(o._id);
    }
  } catch (err) {
    console.error(
      "Error:",
      err.response?.status,
      err.response?.data || err.message
    );
  }
}

async function fetchOrder(orderId) {
  console.log("GET /api/orders/" + orderId);
  try {
    const res = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    console.log(
      "Order status:",
      res.data.orderStatus,
      "paymentStatus:",
      res.data.paymentStatus
    );
  } catch (err) {
    console.error(
      "Fetch order error:",
      err.response?.status,
      err.response?.data || err.message
    );
  }
}

(async function main() {
  if (cmd === "complete") return markOrderComplete(arg);
  if (cmd === "markPaid") return markOrderPaid(arg);
  if (cmd === "batchComplete") return batchComplete(arg);
  if (cmd === "groupMarkPaid") return groupMarkPaid(arg);
  console.error("Unknown command", cmd);
  process.exit(1);
})();
