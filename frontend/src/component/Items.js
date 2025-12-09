import React from 'react'
import Item from './Item'

const Items = ({ items, onAdd }) => {
  if (!items || items.length === 0) {
    return (
      <main>
        <div className="no-items">
          <p>Наразі немає доступних піцц</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {items.map(el => (
        <Item key={el.id} items={el} onAdd={onAdd}/>
      ))}
    </main>
  )
}

export default Items