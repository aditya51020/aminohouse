import React, { useState, useEffect } from 'react';
import AdBanner from '../components/AdBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoginModal from './LoginModal';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { getSessionId } from '../utils/session';
import {
  ShoppingBag,
  Search,
  ChevronRight,
  MapPin,
  Clock,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  IndianRupee,
  Bike,
  Store,
  X,
  Check,
  Plus,
  Minus,
  User,
  Home,
  Briefcase,
  FileText,
  Lock,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Menu = () => {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { addToast } = useToast();

  // Main States
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('menu');
  const [orderType, setOrderType] = useState('dinein');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  // Customization Modal
  const [showCustomize, setShowCustomize] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  // [NEW] Kitchen Status
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [combos, setCombos] = useState([]);
  // [NEW] Ingredient Info Modal
  const [selectedMenuInfo, setSelectedMenuInfo] = useState(null);
  useEffect(() => {
    api.get('/settings/status').then(res => {
      setKitchenOpen(res.data.open);
    }).catch(err => console.error(err));
    api.get('/combos').then(res => setCombos(res.data)).catch(() => { });
  }, []);

  // Customer Info
  const [customerName, setCustomerName] = useState('');

  // [NEW] Listen for Ad Clicks
  useEffect(() => {
    const handleAdClick = (e) => {
      const { type, id } = e.detail;
      if (type === 'category') {
        setSelectedCategory(id);
        // Optional: Scroll to category logic if needed
      } else if (type === 'item') {
        // Find item and open customization/add to cart?
        // This might require searching menu. 
        // For now, let's just search query it so user sees it
        setSearchQuery(id); // Usually id is name for loose link or we match ID
      }
    };
    window.addEventListener('ad-click', handleAdClick);
    return () => window.removeEventListener('ad-click', handleAdClick);
  }, []);
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('Morning'); // [NEW] Default slot
  const [addressType, setAddressType] = useState('Home');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Load saved customer info
  useEffect(() => {
    const saved = localStorage.getItem('customerInfo');
    if (saved) {
      const info = JSON.parse(saved);
      setCustomerName(info.name || '');
      setCustomerPhone(info.phone || '');
      setAddress(info.address || '');
      if (info.addressType) setAddressType(info.addressType);
    }
  }, []);

  // Fetch Menu
  useEffect(() => {

    setLoading(true);
    api
      .get('/menu')
      .then((res) => {

        setMenu(res.data);
        setLoading(false);

        // CHECK FOR REORDER ITEMS
        const reorderItems = localStorage.getItem('reorderItems');
        if (reorderItems) {
          try {
            const items = JSON.parse(reorderItems);
            const newCart = [];
            items.forEach(orderItem => {
              // Match with current menu using id (PostgreSQL uses id, not _id)
              const menuItemId = orderItem.menuItem?.id || orderItem.menuItem;
              const menuProduct = res.data.find(m => m.id === menuItemId);

              if (menuProduct && menuProduct.inStock) {
                // Reconstruct Cart Item
                // Need to check availability again? Yes, but implied by inStock for now.
                // Ideally checking kitchenOpen and time as well, but standard addToCart flow handles validation on click.
                // Here we just pre-fill.

                // Calculate price for customizations if any (simplified)
                let extraPrice = 0;
                // Assuming customizations are stored in orderItem, need to map back if complex
                // For MVP, we use the total stored or recalculate base.
                // Let's try to pass `orderItem.customizations` directly if structure matches.

                // Calculate price robustly. Old orders might not have totalPrice saved.
                // If saved, use it. If not, use current menu price.
                const unitPrice = (orderItem.totalPrice && orderItem.quantity)
                  ? (orderItem.totalPrice / orderItem.quantity)
                  : menuProduct.price;

                newCart.push({
                  ...menuProduct,
                  quantity: orderItem.quantity,
                  customizations: orderItem.customizations,
                  customizationText: orderItem.customizationText || '', // If saved
                  totalPrice: unitPrice,
                  cartId: Date.now() + Math.random()
                });
              }
            });
            if (newCart.length > 0) {
              setCart(newCart);
              addToast('Previous order items added to cart!', 'success');
            }
            localStorage.removeItem('reorderItems');
          } catch (err) {
            console.error("Reorder parse failed", err);
            localStorage.removeItem('reorderItems');
          }
        }
      })
      .catch((err) => {
        console.error("Menu fetch error:", err);
        setMenu([]);
        setLoading(false);
      });
  }, []);

  // Cart Functions
  const calculateTotal = (cartItems) => cartItems.reduce((sum, i) => sum + i.totalPrice * i.quantity, 0);

  const openCustomize = (item) => {
    setCustomizingItem(item);
    const defaults = {};
    if (item.customizations) {
      item.customizations.forEach(group => {
        if (group.type === 'single') {
          defaults[group.name] = group.options[0].name;
        } else if (group.type === 'multiple') {
          defaults[group.name] = [];
        }
      });
    }
    setSelectedOptions(defaults);
    setShowCustomize(true);
  };

  const addToCart = (item, customizations = null) => {
    let additionalPrice = 0;
    let customizationText = '';

    if (customizations) {
      Object.entries(customizations).forEach(([groupName, selection]) => {
        const group = item.customizations?.find(g => g.name === groupName);
        if (group) {
          if (Array.isArray(selection)) {
            selection.forEach(optName => {
              const opt = group.options.find(o => o.name === optName);
              if (opt && opt.price) additionalPrice += opt.price;
            });
            if (selection.length > 0) {
              customizationText += `${groupName}: ${selection.join(', ')}; `;
            }
          } else {
            const opt = group.options.find(o => o.name === selection);
            if (opt && opt.price) additionalPrice += opt.price;
            customizationText += `${groupName}: ${selection}; `;
          }
        }
      });
    }

    const totalPrice = item.price + additionalPrice;
    const cartItem = {
      ...item,
      customizations: customizations,
      customizationText: customizationText.trim(),
      totalPrice: totalPrice,
      cartId: Date.now() + Math.random()
    };

    // Use item.id (PostgreSQL/Sequelize returns 'id' not '_id')
    const existing = cart.find(i =>
      i.id === item.id &&
      JSON.stringify(i.customizations) === JSON.stringify(customizations)
    );

    const newCart = existing
      ? cart.map(i =>
        i.cartId === existing.cartId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
      : [...cart, { ...cartItem, quantity: 1 }];

    setCart(newCart);
  };

  const removeFromCart = (cartItem) => {
    const newCart = cart
      .map(i => i.cartId === cartItem.cartId ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    setCart(newCart);
  };

  const total = calculateTotal(cart);

  // Billing Logic
  const finalTotal = Math.max(0, total - discount);

  // Apply Coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/coupons/verify', {
        code: couponCode,
        cartTotal: total,
        customerId: customer?.id,
        cartItems: cart
      });
      setDiscount(res.data.discount);
      setAppliedCoupon(couponCode);
      addToast(`Coupon applied! You saved ₹${res.data.discount}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid coupon', 'error');
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const saveCustomerInfo = () => {
    localStorage.setItem(
      'customerInfo',
      JSON.stringify({ name: customerName, phone: customerPhone, address, addressType })
    );
  };

  // Session Management - Handled by getSessionId utility now

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      addToast('Please select a payment method', 'error');
      return;
    }

    if (cart.length === 0) {
      addToast('Your cart is empty', 'error');
      setCurrentStep('menu');
      return;
    }

    const customerToken = localStorage.getItem('token');
    const sessionId = getSessionId();

    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }

      await api.post('/orders', {
        items: cart.map(i => ({
          menuItem: i._id || i.id,
          quantity: i.quantity,
          customizations: i.customizations,
          price: i.totalPrice
        })),
        totalAmount: finalTotal,
        paymentMethod: selectedPayment,
        phone: customerPhone || customer?.phone || '0000000000',
        guestName: customerName || 'Guest',
        sessionId: sessionId,
        orderType,
        discount: {
          couponCode: appliedCoupon,
          discountAmount: discount
        }
      }, { headers });

      saveCustomerInfo();
      setCart([]);
      setSelectedPayment('');
      setCurrentStep('success');

    } catch (err) {
      addToast('Order failed: ' + (err.response?.data?.message || 'Please try again'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ITEM INFO MODAL (Ingredients & Manufacturer)
  const ItemInfoModal = () => {
    if (!selectedMenuInfo) return null;
    const item = selectedMenuInfo;
    const hasIngredients = item.Ingredients && item.Ingredients.length > 0;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMenuInfo(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-hidden flex flex-col relative z-10 shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                )}
                <span className="inline-block mt-2 text-lg font-black text-gray-900">₹{item.price}</span>
              </div>
              <button
                onClick={() => setSelectedMenuInfo(null)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Ingredients List */}
            <div className="p-5 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" /> Ingredients & Manufacturers
              </h3>

              {!hasIngredients ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No ingredient info available for this item.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {item.Ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-lg">🌿</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{ing.name}</p>
                          <p className="text-xs text-gray-400">
                            {ing.RecipeItem?.quantityRequired
                              ? `${ing.RecipeItem.quantityRequired} ${ing.unit}`
                              : ing.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {ing.manufacturer ? (
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {ing.manufacturer}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 text-center text-xs text-gray-300">
                Ingredient details are provided for transparency purposes.
              </p>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  // CUSTOMIZATION MODAL
  const CustomizationModal = () => {
    if (!showCustomize || !customizingItem) return null;

    const handleOptionChange = (groupName, optionName, groupType) => {
      setSelectedOptions(prev => {
        if (groupType === 'single') {
          return { ...prev, [groupName]: optionName };
        } else {
          const current = prev[groupName] || [];
          const newSelection = current.includes(optionName)
            ? current.filter(o => o !== optionName)
            : [...current, optionName];
          return { ...prev, [groupName]: newSelection };
        }
      });
    };

    const calculateCustomPrice = () => {
      let extra = 0;
      if (customizingItem.customizations) {
        customizingItem.customizations.forEach(group => {
          const selection = selectedOptions[group.name];
          if (Array.isArray(selection)) {
            selection.forEach(optName => {
              const opt = group.options.find(o => o.name === optName);
              if (opt && opt.price) extra += opt.price;
            });
          } else {
            const opt = group.options.find(o => o.name === selection);
            if (opt && opt.price) extra += opt.price;
          }
        });
      }
      return customizingItem.price + extra;
    };

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomize(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10 shadow-2xl"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{customizingItem.name}</h2>
                <p className="text-sm text-gray-500 font-medium">Customize your order</p>
              </div>
              <button
                onClick={() => setShowCustomize(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto pb-32 scrollbar-hide">
              {customizingItem.customizations?.map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{group.name}</h3>
                    <p className="text-sm text-gray-600">
                      {group.type === 'single' ? 'Select one' : 'Select multiple'}
                      {group.required && <span className="text-red-500"> *</span>}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {group.options.map((option, optIdx) => {
                      const isSelected = group.type === 'single'
                        ? selectedOptions[group.name] === option.name
                        : selectedOptions[group.name]?.includes(option.name);

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionChange(group.name, option.name, group.type)}
                          className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${isSelected ? 'border-green-600 bg-green-50' : 'border-gray-200'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'
                              }`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="font-medium">{option.name}</span>
                          </div>
                          {option.price > 0 && (
                            <span className="text-green-600 font-bold">+₹{option.price}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
              <button
                onClick={() => {
                  addToCart(customizingItem, selectedOptions);
                  setShowCustomize(false);
                }}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg"
              >
                Add to Cart - ₹{calculateCustomPrice()}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  // MENU SCREEN
  if (currentStep === 'menu') {
    const categories = ['all', ...new Set(menu.map((i) => i.category))];
    const filtered = menu.filter(
      (i) =>
        (selectedCategory === 'all' || i.category === selectedCategory) &&
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const containerVariants = {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    };

    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="bg-white sticky top-0 z-20 border-b">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-xl font-bold">AMINOHOUSE</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/customer-dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg active:scale-95 transition"
                >
                  <CreditCard size={18} />
                </button>


                <button
                  onClick={() => setCurrentStep('cart')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg active:bg-gray-200 transition"
                >
                  <ShoppingBag className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-semibold">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder='Search "Sandwich..."'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === cat
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <AdBanner />

        {/* 🔥 COMBO DEALS SECTION */}
        {combos.length > 0 && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-black text-gray-900">🔥 Combo Deals</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">Save More!</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {combos.map(combo => {
                const savings = combo.originalPrice - combo.comboPrice;
                return (
                  <div
                    key={combo.id}
                    className="flex-shrink-0 w-56 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Image strip */}
                    <div className="h-28 bg-gray-100 relative">
                      {combo.imageUrl ? (
                        <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🔥</div>
                      )}
                      {savings > 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                          Save ₹{savings}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-gray-900 truncate">{combo.name}</h3>
                      {/* Item names */}
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {(combo.items || []).map(i => i.name).join(' + ')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs line-through text-gray-400">₹{combo.originalPrice}</span>
                        <span className="font-black text-gray-900">₹{combo.comboPrice}</span>
                      </div>
                      <button
                        onClick={() => {
                          // Add combo as ONE single cart entry at the FULL combo price
                          const comboCartItem = {
                            _id: `combo-${combo.id}`,
                            name: combo.name,
                            price: combo.comboPrice,
                            totalPrice: combo.comboPrice,
                            quantity: 1,
                            imageUrl: combo.imageUrl || (combo.items?.[0]?.imageUrl) || '',
                            customizations: null,
                            customizationText: (combo.items || []).map(i => i.name).join(' + '),
                            cartId: Date.now() + Math.random(),
                            isCombo: true
                          };
                          setCart(prev => {
                            const existing = prev.find(i => i._id === comboCartItem._id);
                            if (existing) {
                              return prev.map(i => i._id === existing._id ? { ...i, quantity: i.quantity + 1 } : i);
                            }
                            return [...prev, comboCartItem];
                          });
                        }}
                        className="mt-2 w-full bg-black text-white py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition active:scale-95"
                      >
                        Add Combo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <motion.div
          className="px-4 py-4 grid grid-cols-2 gap-4"
        >
          {loading && (
            <div className="col-span-2 text-center py-10">
              <p className="text-gray-500">Loading delicious items...</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="col-span-2 text-center py-10">
              <p className="text-gray-500">No items found.</p>
            </div>
          )}

          {filtered.map((item) => {
            const qty = cart.filter(i => i.id === item.id).reduce((sum, i) => sum + i.quantity, 0);
            const hasCustomizations = item.customizations && item.customizations.length > 0;

            const now = new Date();
            const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            // Check time availability using flat Sequelize field names
            let isAvailableTime = true;
            if (item.availability_isTimeBound) {
              const start = item.availability_start || '00:00';
              const end = item.availability_end || '23:59';
              if (start <= end) {
                isAvailableTime = currentHHMM >= start && currentHHMM <= end;
              } else {
                // Spans midnight (e.g. 22:00 to 02:00)
                isAvailableTime = currentHHMM >= start || currentHHMM <= end;
              }
            }

            const isAvailable = item.inStock && kitchenOpen && isAvailableTime;

            return (
              <motion.div
                layout
                key={item._id}
                className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group ${(!isAvailable) ? 'opacity-60 grayscale' : ''}`}
              >
                {/* YE PHOTO WALA PART — COPY-PASTE KAR DO */}
                <div className="h-40 bg-gray-200 relative overflow-hidden">
                  {/* ... Image ... */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div className={`absolute inset-0 flex items-center justify-center text-6xl bg-gray-200 ${item.imageUrl ? 'hidden' : 'flex'}`}>
                    🍔
                  </div>

                  {/* OVERLAY IF CLOSED OR OOS */}
                  {(!isAvailable) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 text-center">
                      <span className="text-white font-bold bg-red-600 px-3 py-1 rounded-full text-xs">
                        {!kitchenOpen ? 'KITCHEN CLOSED' :
                          !item.inStock ? 'OUT OF STOCK' :
                            `Available ${item.availability_start} - ${item.availability_end}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card bottom content */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-sm flex-1">{item.name}</h3>
                    {/* ℹ Info Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedMenuInfo(item); }}
                      className="shrink-0 p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      title="View Ingredients"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  {hasCustomizations && (
                    <p className="text-xs text-orange-600 mt-1">Customizable</p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold">₹{item.price}</span>
                    <button
                      disabled={!isAvailable}
                      onClick={() => (hasCustomizations ? openCustomize(item) : addToCart(item, null))}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {hasCustomizations ? 'Customize' : 'Add'}
                    </button>
                  </div>
                  {qty > 0 && (
                    <div className="mt-2 text-center text-xs text-green-600 font-bold">
                      {qty} in cart
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {
          cart.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="fixed bottom-4 left-4 right-4 z-40"
            >
              <button
                onClick={() => setCurrentStep('cart')}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-black/20 flex justify-between items-center px-6 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </div>
                  <span>View Cart</span>
                </div>
                <span>₹{total}</span>
              </button>
            </motion.div>
          )
        }

        <CustomizationModal />
        <ItemInfoModal />
      </div >
    );
  }

  // CART SCREEN
  if (currentStep === 'cart') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white sticky top-0 z-20 border-b">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => setCurrentStep('menu')}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Your Cart</h1>
          </div>
        </div>

        {/* COUPON SECTION (Moved Up) */}
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 px-4 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Add some delicious items from the menu to proceed</p>
            <button
              onClick={() => setCurrentStep('menu')}
              className="bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-black/20 hover:scale-105 transition-transform"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white border-b">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span className="text-green-600">🏷️</span> Apply Coupon
              </h3>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter Coupon Code"
                  className="border-2 border-dashed border-gray-300 p-3 rounded-xl w-full font-mono uppercase focus:border-black outline-none transition"
                />
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode || discount > 0}
                  className={`px-5 font-bold rounded-xl whitespace-nowrap ${discount > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-black text-white'
                    }`}
                >
                  {discount > 0 ? 'Applied' : 'Apply'}
                </button>
              </div>
              {discount > 0 && (
                <div className="mt-2 bg-green-50 text-green-800 text-sm p-2 rounded-lg flex justify-between items-center">
                  <span>Coupon <strong>{appliedCoupon}</strong> applied</span>
                  <button onClick={() => { setDiscount(0); setAppliedCoupon(null); setCouponCode(''); }} className="text-xs font-bold underline">Remove</button>
                </div>
              )}
            </div>

            <div className="bg-white p-4 border-b">
              <h3 className="font-bold text-gray-900 mb-1">How would you like your order?</h3>
              <p className="text-xs text-gray-400 mb-4">Choose your dining preference</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Dine In */}
                <button
                  onClick={() => setOrderType('dinein')}
                  className={`relative p-5 rounded-2xl border-2 transition-all text-left ${orderType === 'dinein'
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  {orderType === 'dinein' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${orderType === 'dinein' ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    <Building2 className={`w-6 h-6 ${orderType === 'dinein' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <p className="font-bold text-sm">Dine In</p>
                  <p className={`text-xs mt-0.5 ${orderType === 'dinein' ? 'text-gray-300' : 'text-gray-400'}`}>Eat at the cafe</p>
                </button>

                {/* Take Away */}
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`relative p-5 rounded-2xl border-2 transition-all text-left ${orderType === 'takeaway'
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  {orderType === 'takeaway' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${orderType === 'takeaway' ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    <ShoppingBag className={`w-6 h-6 ${orderType === 'takeaway' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <p className="font-bold text-sm">Take Away</p>
                  <p className={`text-xs mt-0.5 ${orderType === 'takeaway' ? 'text-gray-300' : 'text-gray-400'}`}>Pick up & go</p>
                </button>
              </div>

              {/* Info strip */}
              <div className="mt-3 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-gray-100 text-gray-600">
                <Store className="w-3.5 h-3.5" /> Order placed — pick up from the counter!
              </div>
            </div>

            <div className="p-4 space-y-3 pb-64">
              {cart.map((item) => (
                <div key={item.cartId} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-4">

                    {/* YE PHOTO WALA BOX — AB REAL IMAGE DIKHEGI */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {/* Fallback emoji agar image na ho */}
                      <div className={`w-full h-full flex items-center justify-center text-3xl bg-gray-200 ${item.imageUrl ? 'hidden' : 'flex'}`}>
                        🍔
                      </div>
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.name}</h4>
                      {item.customizationText && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.customizationText}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">₹{item.totalPrice} × {item.quantity}</p>
                    </div>

                    {/* Quantity buttons */}
                    <div className="flex items-center gap-2 bg-black text-white rounded-lg">
                      <button
                        onClick={() => removeFromCart(item)}
                        className="px-3 py-1.5 font-bold hover:bg-black transition"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item, item.customizations)}
                        className="px-3 py-1.5 font-bold hover:bg-green-700 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Old Coupon Section Removed From Here */}

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-gray-600"><span>Items Total</span><span>₹{total}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="pt-3 border-t font-bold text-lg flex justify-between">
                  <span>Total</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>
              <button
                onClick={() => setCurrentStep('payment')}
                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-black hover:bg-gray-800 transition-all"
              >
                Proceed to Pay — ₹{finalTotal}
              </button>
            </div>
          </>
        )}
      </div >
    );
  }

  // CHECKOUT SCREEN
  if (currentStep === 'checkout') {
    const isFirstTime = !localStorage.getItem('customerInfo');

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-white sticky top-0 z-20 border-b shadow-sm">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setCurrentStep('cart')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Delivery Details</h1>
          </div>
        </div>

        <div className="p-4 space-y-6 max-w-lg mx-auto">
          {/* Personal Details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Contact Info
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-gray-200 border rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9998887776"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-gray-200 border rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              Delivery Location
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Flat / House No / Floor, Building Name..."
                  className="w-full p-4 bg-gray-50 border-gray-200 border rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium resize-none placeholder-gray-400"
                />
              </div>

              {/* Address Type Chips */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2 block">Save address as</label>
                <div className="flex gap-3">
                  {[
                    { type: 'Home', icon: Home },
                    { type: 'Work', icon: Briefcase },
                    { type: 'Other', icon: MapPin }
                  ].map(({ type, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setAddressType(type)}
                      className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-2 border transition-all ${addressType === type
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-bold">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Instructions (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Leave at door, Do not ring bell"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-gray-200 border rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => {
                if (!customerName || !customerPhone || !address) {
                  addToast('Please fill in your name, phone, and address', 'error');
                  return;
                }
                if (customerPhone.length < 10) {
                  addToast('Please enter a valid 10-digit phone number', 'error');
                  return;
                }
                saveCustomerInfo();
                setCurrentStep('payment');
              }}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-green-200 shadow-lg active:scale-[0.98] transition-all flex justify-between items-center px-6"
            >
              <span>Proceed to Pay</span>
              <span>₹{finalTotal}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT SCREEN
  if (currentStep === 'payment') {
    const paymentMethods = [
      { id: 'upi', name: 'UPI / QR', icon: <Smartphone className="w-6 h-6" /> },
      { id: 'card', name: 'Card', icon: <CreditCard className="w-6 h-6" /> },
      { id: 'cod', name: 'Cash', icon: <IndianRupee className="w-6 h-6" /> },
    ];

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white sticky top-0 z-20 border-b">
          <div className="px-4 py-4 flex items-center gap-4">
            <button onClick={() => setCurrentStep('cart')}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Payment</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {paymentMethods.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedPayment(m.id)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 ${selectedPayment === m.id ? 'border-black bg-green-50' : 'border-gray-200 bg-white'
                }`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                {m.icon}
              </div>
              <span className="font-bold">{m.name}</span>
            </button>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <button
            onClick={handlePlaceOrder}
            disabled={!selectedPayment || loading}
            className="w-full bg-black text-white py-5 rounded-xl font-bold text-lg disabled:bg-gray-300"
          >
            {loading ? 'Processing...' : selectedPayment === 'cod' ? 'Place Order' : 'Pay'} ₹{finalTotal}
          </button>
        </div>

        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={handlePlaceOrder} />}
      </div>
    );
  }

  // SUCCESS SCREEN
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Check className="w-20 h-20 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Placed!</h1>
          <p className="text-xl text-gray-600 mb-2">Your delicious food is being prepared</p>
          <p className="text-lg text-gray-500 mb-10">We'll notify you when it's ready</p>

          <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <button
              onClick={() => {
                navigate('/customer-dashboard');
              }}
              className="bg-black text-white px-12 py-5 rounded-full text-xl font-bold hover:bg-gray-800 transition shadow-lg w-full"
            >
              Track Order
            </button>
            <button
              onClick={() => {
                setCurrentStep('menu');
                setCart([]);
              }}
              className="bg-white text-gray-900 border-2 border-gray-100 px-12 py-5 rounded-full text-xl font-bold hover:bg-gray-50 transition w-full"
            >
              Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Menu;