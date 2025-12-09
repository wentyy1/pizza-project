import React, { useState, useEffect } from 'react'
import Order from './Order'

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function OrdersPage({ order = [], onDelete, onBack, onOrderPlaced, onChangeQuantity }) {
  const [localOrder, setLocalOrder] = useState(order)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [payment, setPayment] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Синхронізуємо локальний стан з пропсами
  useEffect(() => {
    setLocalOrder(order)
  }, [order])

  // Розраховуємо загальну суму з локального стану
  const total = (localOrder || []).reduce((acc, el) => acc + Number(el.price || 0) * (Number(el.qty) || 1), 0)

  // Обробник зміни кількості з миттєвим оновленням UI
  const handleChangeQuantity = (itemId, newQty) => {
    // Оновлюємо локальний стан для миттєвого відображення
    setLocalOrder(prev => prev.map(item => 
      item.id === itemId ? { ...item, qty: newQty } : item
    ))
    
    // Викликаємо оригінальну функцію для оновлення в батьківському компоненті
    if (onChangeQuantity) {
      onChangeQuantity(itemId, newQty)
    }
  }

  async function submitOrder() {
    setError(null)
    if (!localOrder || localOrder.length === 0) {
      setError('Кошик порожній')
      return
    }
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !street.trim()) {
      setError('Вкажіть імʼя, прізвище, телефон і адресу доставки')
      return
    }

    const payload = {
      customerFirst: firstName.trim(),
      customerLast: lastName.trim(),
      items: localOrder.map(i => ({ title: i.title, price: Number(i.price || 0), qty: Number(i.qty) || 1, img: i.img || null })),
      total,
      phone: phone.trim(),
      address: street.trim(),
      paymentMethod: payment,
      createdAt: new Date().toISOString()
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3002/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server error: ${res.status} ${text}`)
      }

      const data = await res.json()
      const orderId = data.id || null

      // Створюємо стильоване спливаюче вікно з назвами і кількістю піц
      const itemsHtml = (payload.items || []).map(it => `
        <div class="pizza-item">
          <img src="${escapeHtml(it.img || 'https://via.placeholder.com/100x100?text=No+Image')}" alt="${escapeHtml(it.title)}" />
          <div class="pi-info">
            <h4>${escapeHtml(it.title)}</h4>
            <div class="pi-qty">Кількість: <strong>${escapeHtml(it.qty)}</strong></div>
            <div class="pi-price">Ціна за од.: ${Number(it.price).toFixed(2)}₴</div>
          </div>
        </div>
      `).join('')

      const win = window.open('', '_blank', 'width=520,height=700,scrollbars=yes')
      if (win) {
        const html = `
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Підтвердження замовлення</title>
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <style>
                body{font-family:Arial, Helvetica, sans-serif;margin:0;padding:18px;background:#f7f7f8;color:#222}
                .confirm-wrap{max-width:480px;margin:0 auto;background:#fff;padding:18px;border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,0.08)}
                h2{margin:0 0 12px;font-size:20px;color:#111}
                .meta{font-size:14px;color:#555;margin-bottom:12px}
                .pizza-item{display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #eee}
                .pizza-item:first-of-type{border-top:0}
                .pizza-item img{width:80px;height:80px;object-fit:cover;border-radius:6px}
                .pi-info h4{margin:0 0 6px;font-size:16px}
                .pi-qty,.pi-price{font-size:13px;color:#444}
                .total{margin-top:14px;font-weight:700;font-size:16px}
                .customer{margin-top:12px;font-size:14px;color:#333}
                .close-btn{display:inline-block;margin-top:16px;padding:8px 12px;background:#2ecc71;color:#fff;border-radius:6px;text-decoration:none}
              </style>
            </head>
            <body>
              <div class="confirm-wrap">
                <h2>Замовлення підтверджено</h2>
                ${orderId ? `<div class="meta">Номер замовлення: <strong>${escapeHtml(orderId)}</strong></div>` : ''}
                <div class="meta">Покупець: ${escapeHtml(payload.customerFirst)} ${escapeHtml(payload.customerLast)}</div>
                <div class="meta">Сума: <strong>${total.toFixed(2)}₴</strong></div>
                <div class="meta">Телефон: ${escapeHtml(payload.phone)}</div>
                <div class="meta">Адреса: ${escapeHtml(payload.address)}</div>
                <div class="meta">Оплата: ${escapeHtml(payload.paymentMethod)}</div>
                <div style="margin-top:12px">${itemsHtml}</div>
                <div class="total">Загальна сума: ${total.toFixed(2)}₴</div>
                <div class="customer">Дякуємо! Ми зв'яжемося з вами найближчим часом.</div>
                <a class="close-btn" href="#" onclick="window.close();return false;">Закрити</a>
              </div>
            </body>
          </html>
        `
        win.document.write(html)
        win.document.close()
      } else {
        alert('Замовлення підтверджено' + (orderId ? ` (№${orderId})` : ''))
      }

      if (onOrderPlaced) onOrderPlaced(data)
    } catch (err) {
      console.error(err)
      setError('Не вдалося оформити замовлення. Спробуйте пізніше.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="orders-page" style={{ padding: 20 }}>
      <h1>Мої замовлення</h1>
      <div style={{ marginBottom: 12 }}>
        <button className='btn_beack' onClick={() => (onBack ? onBack() : window.history.back())}>Назад</button>
      </div>

      {(!localOrder || localOrder.length === 0) ? (
        <div>У вас немає замовлень</div>
      ) : (
        <>
          <div className="orders-list">
            {localOrder.map(o => (
              <Order key={o.id} item={o} onDelete={onDelete} onChangeQty={handleChangeQuantity} />
            ))}
          </div>

          <div style={{ marginTop: 12, fontWeight: 700 }}>
            Загальна сума: {total.toFixed(2)}₴
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Дані для доставки</h3>

            <div style={{ marginTop: 8 }}>
              <label>Імʼя</label><br />
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ім'я" />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Прізвище</label><br />
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Прізвище" />
            </div>

            <div style={{ marginTop: 8 }}>
              <label>Телефон</label><br />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380..." />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Вулиця, будинок, квартира</label><br />
              <input value={street} onChange={e => setStreet(e.target.value)} placeholder="вул. Х, буд. Y, кв. Z" />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>Спосіб оплати</label><br />
              <select value={payment} onChange={e => setPayment(e.target.value)}>
                <option value="cash">Готівка</option>
                <option value="card">Карта при отриманні</option>
                <option value="online">Оплата онлайн</option>
              </select>
            </div>

            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

            <div style={{ marginTop: 12 }}>
              <button className='btn_next' onClick={submitOrder} disabled={loading}>
                {loading ? 'Оформлення...' : 'Оформити замовлення'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}