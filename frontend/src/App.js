// ...existing code...
import React from "react";
import Header from "./component/Header";
import Footer from "./component/Footer";
import Items from "./component/Items";
import OrdersPage from './component/OrdersPage'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      order: [],
      items: [], // Пустий масив, дані будемо завантажувати з API
      loading: true,
      error: null,
      currentPage: 'home'
    };
    this.addToOrder = this.addToOrder.bind(this);
    this.deleteToOrder = this.deleteToOrder.bind(this);
    this.handleNavigate = this.handleNavigate.bind(this);
    this.handleOrderPlaced = this.handleOrderPlaced.bind(this);
    this.handleChangeQuantity = this.handleChangeQuantity.bind(this);
  }

  // Додаємо метод для завантаження даних з API
  componentDidMount() {
    this.loadItemsFromAPI();
  }
   handleChangeQuantity(id, qty) {
    const q = Number(qty) || 1;
    this.setState(prev => ({
      order: prev.order.map(it => it.id === id ? { ...it, qty: q < 1 ? 1 : q } : it)
    }));
  }

  // Метод для завантаження піцц з бекенду
  loadItemsFromAPI = async () => {
    try {
      this.setState({ loading: true, error: null });
 
       const response = await fetch('http://localhost:3002/items');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Трансформуємо дані з бази у формат, який очікує ваш фронтенд
      const transformedItems = data.map(item => ({
        id: item.id,
        title: item.name,
        img: item.image_url,
        desc: item.description,
        category: item.category,
        price: parseFloat(item.price) // Перетворюємо Decimal на number
      }));
      
      this.setState({ 
        items: transformedItems, 
        loading: false 
      });
      
    } catch (error) {
      console.error('Error loading items:', error);
      this.setState({ 
        error: 'Не вдалося завантажити меню. Спробуйте пізніше.', 
        loading: false 
      });
    }
  }

  handleNavigate(page) {
    this.setState({ currentPage: page });
  }

  handleOrderPlaced(orderResult) {
    // Очистити кошик та перейти на головну
    this.setState({ order: [], currentPage: 'home' });
    console.log('Order placed', orderResult);
  }

  
  render() {
    const { items, order, loading, error, currentPage } = this.state;

    return (
      <div className="wrapper">
        <Header
          order={order}
          onDelete={this.deleteToOrder}
          onNavigate={this.handleNavigate}
          onChangeQuantity={this.handleChangeQuantity}  // <--- передаємо навігацію
        />

        {currentPage === 'orders' ? (
          <OrdersPage
            key={order.length}
            order={order}
            onDelete={this.deleteToOrder}
            onBack={() => this.handleNavigate('home')}
            onOrderPlaced={this.handleOrderPlaced}
            onChangeQuantity={this.handleChangeQuantity}
          />
        ) : (
          <>
            {loading && (
              <div className="loading-message">
                <p>Завантаження меню...</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={this.loadItemsFromAPI}>Спробувати знову</button>
              </div>
            )}

            {!loading && !error && (
              <Items items={items} onAdd={this.addToOrder} />
            )}
          </>
        )}

        <Footer />
      </div>
    );
  }

  deleteToOrder(id) {
    this.setState({ order: this.state.order.filter(el => el.id !== id) });
  }

  addToOrder(item) {
    // якщо товар вже є — підвищуємо qty на 1
    const existing = this.state.order.find(el => el.id === item.id)
    if (existing) {
      this.setState(prev => ({
        order: prev.order.map(el => el.id === item.id ? { ...el, qty: (Number(el.qty) || 1) + 1 } : el)
      }))
    } else {
      this.setState({ order: [...this.state.order, { ...item, qty: 1 }] });
    }
  }
}

export default App;