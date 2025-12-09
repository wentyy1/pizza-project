import React, { Component } from 'react'

export class Item extends Component {
  render() {
    const { items, onAdd } = this.props;
    
    return (
      <div className='item'>
        <div className="item-image-container">
          <img 
            src={items.img} 
            alt={items.title}
            className="pizza-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
        </div>
        <h2>{items.title}</h2>
        <p>{items.desc}</p>
        <b>{items.price}₴</b>
        
        <div className='buy'>
          <button onClick={() => onAdd(items)}>Замовити</button>
        </div>
      </div>
    )
  }
}

export default Item