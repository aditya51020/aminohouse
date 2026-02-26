import { CheckCircle, ChefHat, Bell, ThumbsUp, Clock, Bike } from 'lucide-react';

const OrderTracker = ({ order }) => {
    if (!order) return null;

    const isDelivery = order.orderType === 'delivery';

    const statuses = isDelivery ? [
        { key: 'Pending', label: 'Order Received', icon: Clock },
        { key: 'Accepted', label: 'Accepted', icon: ThumbsUp },
        { key: 'Cooking', label: 'Cooking', icon: ChefHat },
        { key: 'Out for Delivery', label: 'Out for Delivery', icon: Bike },
        { key: 'Delivered', label: 'Delivered', icon: CheckCircle },
    ] : [
        { key: 'Pending', label: 'Order Received', icon: Clock },
        { key: 'Accepted', label: 'Accepted', icon: ThumbsUp },
        { key: 'Cooking', label: 'Cooking', icon: ChefHat },
        { key: 'Ready', label: 'Ready to Serve', icon: Bell },
        { key: 'Served', label: 'Served', icon: CheckCircle },
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key === order.status);
    // If status is 'Paid' or 'Completed', consider it same as 'Served' or beyond for visual purposes
    // If status is 'Paid' or 'Completed', consider it same as 'Served' or beyond for visual purposes
    const isCompleted = ['Paid', 'Completed', 'Delivered', 'Served'].includes(order.status);
    const activeIndex = isCompleted ? statuses.length - 1 : currentStatusIndex;

    return (
        <div className="w-full max-w-md mx-auto p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Order #{order._id.slice(-6)}</p>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">
                        {isCompleted ? 'Order Completed' : 'Tracking Order'}
                    </h2>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isCompleted || order.status === 'Served' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {order.status}
                </div>
            </div>

            <div className="relative flex flex-col gap-6 pl-4 border-l-2 border-gray-100 ml-4">
                {statuses.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isPast = index < activeIndex;

                    const Icon = step.icon;

                    return (
                        <div key={step.key} className="relative pl-6">
                            {/* Dot on timeline */}
                            <div className={`absolute -left-[25px] top-0 w-8 h-8 rounded-full border-4 flex items-center justify-center bg-white transition-all duration-500 ${isActive ? 'border-blue-500 text-blue-600 scale-110' :
                                isPast ? 'border-green-500 text-green-600' :
                                    'border-gray-200 text-gray-300'
                                }`}>
                                <Icon size={14} strokeWidth={2.5} />
                            </div>

                            <div>
                                <h3 className={`text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : isPast ? 'text-gray-900' : 'text-gray-400'
                                    }`}>
                                    {step.label}
                                </h3>
                                {isActive && (
                                    <p className="text-xs text-blue-500 mt-1 animate-pulse font-medium">
                                        {index === 0 ? 'Waiting for confirmation...' :
                                            index === 1 ? 'Kitchen has accepted your order.' :
                                                index === 2 ? 'Chef is preparing your meal.' :
                                                    index === 3 ? (isDelivery ? 'Rider is on the way!' : 'Almost there!') :
                                                        'Enjoy your meal!'}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTracker;
