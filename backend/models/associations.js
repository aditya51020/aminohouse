const User = require('./userModel');
const Admin = require('./Admin');
const Customer = require('./customerModel');
const Ingredient = require('./ingredientModel');
const InventoryLog = require('./inventoryLogModel');
const Menu = require('./menuModel');
const Order = require('./orderModel');
const OrderItem = require('./OrderItem');
const RecipeItem = require('./RecipeItem'); // Junction Table
const Setting = require('./settingModel');
const Ad = require('./adModel');
const Coupon = require('./couponModel');
const CouponUsage = require('./couponUsageModel');
const Subscription = require('./subscriptionModel');
const SubscriptionUsage = require('./subscriptionUsageModel');

// Menu <-> Ingredient (Many-to-Many via RecipeItem)
Menu.belongsToMany(Ingredient, { through: RecipeItem });
Ingredient.belongsToMany(Menu, { through: RecipeItem });

// Order <-> OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: 'OrderId' });
OrderItem.belongsTo(Order, { foreignKey: 'OrderId' });

// OrderItem -> Menu (One-to-One / Many-to-One logic for reference)
OrderItem.belongsTo(Menu, { foreignKey: 'MenuId' });

// Order -> Customer (Many-to-One)
Customer.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

// Subscription <-> SubscriptionUsage
Subscription.hasMany(SubscriptionUsage, { foreignKey: 'subscriptionId' });
SubscriptionUsage.belongsTo(Subscription, { foreignKey: 'subscriptionId' });

// Coupon <-> CouponUsage
Coupon.hasMany(CouponUsage, { foreignKey: 'couponId' });
CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId' });

// Customer <-> CouponUsage
Customer.hasMany(CouponUsage, { foreignKey: 'customerId' });
CouponUsage.belongsTo(Customer, { foreignKey: 'customerId' });

// Order <-> CouponUsage
Order.hasOne(CouponUsage, { foreignKey: 'orderId' });
CouponUsage.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = {
    User,
    Admin,
    Customer,
    Ingredient,
    InventoryLog,
    Menu,
    Order,
    OrderItem,
    RecipeItem,
    Setting,
    Ad,
    Coupon,
    CouponUsage,
    Subscription,
    SubscriptionUsage
};
