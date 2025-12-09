import React, { useState, useEffect } from 'react'
import { FaTrash } from 'react-icons/fa'


function Order({ item, onDelete, onChangeQty }) {
  const [quantity, setQuantity] = useState(Number(item.qty) || 1)
  
  // Синхронізуємо локальну кількість з пропсами
  useEffect(() => {
    setQuantity(Number(item.qty) || 1)
  }, [item.qty])

  const lineTotal = (Number(item.price) || 0) * quantity

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQty = quantity - 1
      setQuantity(newQty)
      if (onChangeQty) {
        onChangeQty(item.id, newQty)
      }
    }
  }

  const handleIncrease = () => {
    const newQty = quantity + 1
    setQuantity(newQty)
    if (onChangeQty) {
      onChangeQty(item.id, newQty)
    }
  }

  return (
    <div className='order-item' style={{display:'flex', gap:12, alignItems:'center'}}>
      <img 
        src={item.img} 
        alt={item.title}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
        }}
        style={{width:80, height:80, objectFit:'cover', borderRadius:6}}
      />
      <div className='order-content' style={{flex:1}}>
        <div className='order-header' style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <h3 style={{margin:0}}>{item.title}</h3>
          <FaTrash 
            className='delete' 
            onClick={() => onDelete(item.id)}
            style={{cursor:'pointer', color:'#c0392b'}}
          />
        </div>

        <div style={{display:'flex', alignItems:'center', gap:12, marginTop:8}}>
          <div className="qty-control">
            <button 
              className="qty-btn" 
              onClick={handleDecrease}
              disabled={quantity <= 1}
            >-</button>
            <span className="qty-value">{quantity}</span>
            <button 
              className="qty-btn" 
              onClick={handleIncrease}
            >+</button>
          </div>

          <div style={{marginLeft:'auto', fontWeight:700}}>
            {lineTotal.toFixed(2)}₴
            <div style={{fontSize:12, color:'#666'}}>{Number(item.price).toFixed(2)}₴ / од.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Order