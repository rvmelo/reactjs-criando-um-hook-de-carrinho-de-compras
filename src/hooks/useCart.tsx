import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

 

  const addProduct = async (productId: number) => {
    try {
      // TODO

      const response = await api.get<Product>(`/products/${productId}`);

      const foundProduct = response.data;

      if (!foundProduct) throw new Error('Erro na adição do produto');

      const cartProductIndex = cart.findIndex(cartProduct => cartProduct.id === productId);

      const cartProducts = [...cart];

      const stockResponse = await api.get<Stock>(`/stock/${productId}`);

      const productStock = stockResponse.data;
      
      const productAmount = productStock?.amount;

      const amount = cartProductIndex !== -1 ? cartProducts[cartProductIndex].amount+1 : 1;
      
      if (amount > productAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 
      
      if (cartProductIndex !== -1) {
        cartProducts[cartProductIndex].amount += 1;
      } else {
        cartProducts.push({...foundProduct, amount: 1});
      }

      setCart(cartProducts);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartProducts));

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const foundProduct = cart.find(p => p.id === productId);

      if (!foundProduct) throw new Error('Erro na remoção do produto');

      const updatedCart = cart.filter(c => c.id !== productId);

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch (err) {
      // TODO
      toast.error(err.message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      if (amount <= 0) return;

      const isProductOnCart = cart.find(c => c.id === productId); 

      if (!isProductOnCart) throw new Error();

      const stockResponse = await api.get<Stock>(`/stock/${productId}`);
      const stockAmount = stockResponse.data?.amount;

      if (amount > stockAmount ) {
        toast.error('Quantidade solicitada fora de estoque');
        return;      
      };

      

      const cartProducts = [...cart];

      const cartProductIndex = cartProducts.findIndex(cartProduct => cartProduct.id === productId);

      cartProducts[cartProductIndex].amount = amount;

      setCart(cartProducts);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartProducts));


    } catch (err) {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
