import React, { useState, useRef, useEffect } from 'react'
import { FaBasketShopping, FaUser } from 'react-icons/fa6'

import Order from './Order'

export default function Header(props) {
  const [cartOpen, setCartOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [localOrder, setLocalOrder] = useState(props.order || [])
  const rootRef = useRef(null)

  // Синхронізуємо локальний стан з пропсами
  useEffect(() => {
    setLocalOrder(props.order || [])
  }, [props.order])

  // враховуємо qty при підрахунку суми (використовуємо локальний стан)
  const summa = localOrder.reduce((acc, el) => acc + Number(el.price || 0) * (Number(el.qty) || 1), 0)

  // Обробник зміни кількості для миттєвого оновлення
  const handleChangeQuantity = (itemId, newQty) => {
    // Оновлюємо локальний стан для миттєвого відображення
    setLocalOrder(prev => prev.map(item => 
      item.id === itemId ? { ...item, qty: newQty } : item
    ))
    
    // Викликаємо оригінальну функцію для оновлення в батьківському компоненті
    if (props.onChangeQuantity) {
      props.onChangeQuantity(itemId, newQty)
    }
  }

  useEffect(() => {
    function handleOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setCartOpen(false)
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const user = props.user || { name: 'Гість', img: null }

  return (
    <header ref={rootRef}>
      <div>
        {/* Іконка профілю */}
        <FaUser
          onClick={() => { setUserOpen(s => !s); setCartOpen(false) }}
          className={`account-button ${userOpen ? 'active' : ''}`}
          title="Акаунт"
        />

        {/* Кошик з лічильником над іконою */}
        <div className="cart-wrap">
          <FaBasketShopping
            onClick={() => { setCartOpen(s => !s); setUserOpen(false) }}
            className={`shop-cart-button ${cartOpen ? 'active' : ''}`}
            title="Кошик"
          />
          {localOrder.length > 0 && (
            <span className="cart-count">
              {localOrder.reduce((acc, it) => acc + (Number(it.qty) || 1), 0)}
            </span>
          )}
        </div>
      </div>

      {/* Панель акаунта */}
      {userOpen && (
        <div className="user-panel">
          <div className="user-top">
            <img
              src={user.img || 'https://via.placeholder.com/80x80?text=User'}
              alt={user.name}
              className="user-avatar"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=User' }}
            />
            <div className="user-info">
              <strong>{user.name}</strong>
              <div className="user-email">{user.email || ''}</div>
            </div>
          </div>

          <div className="user-actions">
            <button onClick={() => { setUserOpen(false); props.onNavigate && props.onNavigate('profile') }}>Профіль</button>
            <button onClick={() => { setUserOpen(false); props.onNavigate && props.onNavigate('orders') }}>Замовлення</button>
            <button onClick={() => { setUserOpen(false); props.onLogout && props.onLogout() }}>Вихід</button>
          </div>
        </div>
      )}

      {/* Панель корзини */}
      {cartOpen && (
        <div className='shop-cart'>
          {localOrder.length === 0 ? (
            <div className='empty'>Кошик порожній</div>
          ) : (
            <>
              {localOrder.map(el => (
                <Order
                  onDelete={props.onDelete}
                  onChangeQty={handleChangeQuantity}
                  key={el.id}
                  item={el}
                />
              ))}
              <p className='summa'>Загальна сума: {summa.toFixed(2)}₴</p>
              <button 
                className='btn_cart' 
                onClick={() => { 
                  setCartOpen(false)
                  props.onNavigate && props.onNavigate('orders') 
                }}
              >
                Замовлення
              </button>
            </>
          )}
        </div>
      )}

      <div className='nav-center'>
        <span className='logo'>Pizza Day</span>
        <ul className='nav-menu'>
          <li onClick={() => props.onNavigate && props.onNavigate('home')}>Меню</li>
          <li onClick={() => props.onNavigate && props.onNavigate('contact')}>Контакти</li>
        </ul>
      </div>
      <div className='nav-links'></div>
    </header>
  )
}