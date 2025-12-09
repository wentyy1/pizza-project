# Сутності піддоменів pizzaDay

## 🍕 Піддомен Меню (Menu)
**Відповідає за управління каталогом піц**

### Pizza (Піца)
- id: UUID
- name: string (назва піци)
- description: string (опис)
- price: number (ціна)
- image: string (URL зображення)
- ingredients: string[] (список інгредієнтів)
- categoryId: UUID (посилання на категорію)
- isAvailable: boolean (доступність)

### Category (Категорія)
- id: UUID  
- name: string (назва категорії)
- slug: string (URL-ідентифікатор)
- description: string (опис категорії)

## 🛒 Піддомен Кошик (Cart)
**Відповідає за тимчасове зберігання обраних товарів**

### Cart (Кошик)
- id: UUID
- userId: UUID (посилання на користувача)
- items: CartItem[] (елементи кошика)
- createdAt: Date
- updatedAt: Date

### CartItem (Елемент кошика)
- id: UUID
- cartId: UUID
- pizzaId: UUID
- quantity: number (кількість)
- price: number (ціна на момент додавання)

## 📦 Піддомен Замовлення (Orders)
**Відповідає за обробку та відстеження замовлень**

### Order (Замовлення)
- id: UUID
- userId: UUID
- status: OrderStatus (статус)
- items: OrderItem[] (елементи замовлення)
- totalAmount: number (загальна сума)
- deliveryAddress: string (адреса доставки)
- phoneNumber: string (контактний телефон)
- createdAt: Date
- updatedAt: Date

### OrderItem (Елемент замовлення)
- id: UUID
- orderId: UUID
- pizzaId: UUID
- pizzaName: string (назва піци на момент замовлення)
- quantity: number
- unitPrice: number (ціна на момент замовлення)

### OrderStatus (Статус замовлення)
```javascript
const OrderStatus = {
  PENDING: 'pending',      // Очікує підтвердження
  CONFIRMED: 'confirmed',  // Підтверджено
  PREPARING: 'preparing',  // Готується
  READY: 'ready',         // Готове до доставки
  DELIVERING: 'delivering', // В дорозі
  DELIVERED: 'delivered',  // Доставлено
  CANCELLED: 'cancelled'   // Скасовано
}
