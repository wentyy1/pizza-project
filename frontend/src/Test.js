import React, { useState, useEffect } from "react";
import { fetchWithResilience } from "./lib/http.js";
import { getOrReuseKey } from "./lib/idempotency.js";

const API = "http://localhost:3002";

export default function LabTest() {
  const [title, setTitle] = useState("");
  const [log, setLog] = useState([]);
  const [degraded, setDegraded] = useState(false);
  const [failCount, setFailCount] = useState(0);

  // Healthcheckвщ
  async function checkHealth() {
    try {
      const res = await fetchWithResilience(`${API}/lab/health`, {
        retry: { retries: 0, timeoutMs: 1000 }
      });

      const data = await res.json();
      setFailCount(0);
      return data;

    } catch (err) {
      setFailCount(prev => {
        const next = prev + 1;
        if (next >= 3) setDegraded(true);
        return next;
      });
    }
  }

  useEffect(() => {
    const t = setInterval(checkHealth, 3000);
    return () => clearInterval(t);
  }, []);

  async function createOrder() {
    const payload = { title };
    const key = await getOrReuseKey(payload);

    const res = await fetchWithResilience(`${API}/lab/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
      idempotencyKey: key,
      retry: { retries: 2 }
    });

    const data = await res.json();

    setLog(prev => [...prev, data]);
  }

  async function doubleClickTest() {
  const payload = { title };
  const key = await getOrReuseKey(payload);

  const p1 = fetchWithResilience(`${API}/lab/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey: key
  });

  const p2 = fetchWithResilience(`${API}/lab/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey: key
  });
  const [a, b] = await Promise.all([p1, p2]);
  const resA = await a.json();
  const resB = await b.json();

  setLog(prev => [
    ...prev,
    resA,
    resB
  ]);
}
  return (
    <div style={{ padding: 20 }}>
      <h1>Lab 5 Test Panel</h1>

      {degraded && (
        <div style={{
          background: "red",
          color: "white",
          padding: 10,
          marginBottom: 20
        }}>
          ⚠️ Сервіс перевантажено (degraded mode)
        </div>
      )}

      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <br/><br/>

      <button onClick={createOrder} disabled={degraded}>
        Створити замовлення
      </button>

      <button onClick={doubleClickTest} disabled={degraded} style={{ marginLeft: 10 }}>
        Двічі одночасно (тест ідемпотентності)
      </button>

      <h2>Log:</h2>
      <pre>{JSON.stringify(log, null, 2)}</pre>
    </div>
  );
}
