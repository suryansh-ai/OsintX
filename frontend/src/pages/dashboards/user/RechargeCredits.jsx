import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCredits } from '../../../context/CreditContext';
import { 
  Zap, ArrowLeft, CreditCard, CheckCircle, Shield, 
  Clock, TrendingUp, Gift, Star, Tag, ArrowRight,
  ShoppingCart, Percent, X
} from 'lucide-react';

/**
 * RechargeCredits Page
 * 
 * A dedicated page for purchasing credits with checkout flow.
 * Ready for backend integration with payment gateway.
 * 
 * Backend Integration Points:
 * - POST /api/payments/create-order - Create payment order
 *   Request: { planId, amount, currency, redeemCode }
 *   Response: { orderId, paymentUrl, discount, finalAmount }
 * 
 * - POST /api/redeem/validate - Validate redeem code
 *   Request: { code, planId }
 *   Response: { valid, discountType, discountValue, message }
 * 
 * - POST /api/payments/verify - Verify payment after completion
 *   Request: { orderId, paymentId, signature }
 *   Response: { success, credits, newBalance }
 */

const RechargeCredits = () => {
  const navigate = useNavigate();
  const { credits, addCredits } = useCredits();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentStep, setCurrentStep] = useState('select'); // 'select' | 'checkout' | 'success'
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState(null);
  
  // Redeem code state
  const [redeemCode, setRedeemCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [codeError, setCodeError] = useState('');

  const plans = [
    { 
      id: 'starter', 
      name: 'Starter', 
      credits: 100, 
      price: 99, 
      popular: false, 
      color: 'from-slate-500 to-zinc-600'
    },
    { 
      id: 'basic', 
      name: 'Basic', 
      credits: 250, 
      price: 199, 
      popular: false, 
      color: 'from-cyan-500 to-blue-600'
    },
    { 
      id: 'pro', 
      name: 'Pro', 
      credits: 500, 
      price: 349, 
      popular: true, 
      color: 'from-amber-500 to-orange-600'
    },
    { 
      id: 'enterprise', 
      name: 'Enterprise', 
      credits: 1000, 
      price: 599, 
      popular: false, 
      color: 'from-violet-500 to-purple-600'
    },
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  
  // Calculate final price after discount
  const calculateFinalPrice = () => {
    if (!selectedPlanData) return 0;
    if (!appliedDiscount) return selectedPlanData.price;
    
    if (appliedDiscount.type === 'percentage') {
      return Math.round(selectedPlanData.price * (1 - appliedDiscount.value / 100));
    } else {
      return Math.max(0, selectedPlanData.price - appliedDiscount.value);
    }
  };

  const handleApplyRedeemCode = async () => {
    if (!redeemCode.trim()) return;
    
    setIsValidatingCode(true);
    setCodeError('');
    
    try {
      // ============================================
      // BACKEND INTEGRATION POINT
      // ============================================
      // const response = await fetch('/api/redeem/validate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code: redeemCode, planId: selectedPlan }),
      // });
      // const data = await response.json();
      // if (data.valid) {
      //   setAppliedDiscount({ type: data.discountType, value: data.discountValue, code: redeemCode });
      // } else {
      //   setCodeError(data.message || 'Invalid code');
      // }
      // ============================================

      // Mock validation
      console.log('[RechargeCredits] Validating redeem code:', redeemCode);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock codes
      const validCodes = {
        'NEWUSER10': { type: 'percentage', value: 10 },
        'SAVE20': { type: 'percentage', value: 20 },
        'FLAT50': { type: 'fixed', value: 50 },
        'OSINTX100': { type: 'fixed', value: 100 },
      };
      
      const code = redeemCode.toUpperCase();
      if (validCodes[code]) {
        setAppliedDiscount({ ...validCodes[code], code });
        setCodeError('');
      } else {
        setCodeError('Invalid or expired code');
        setAppliedDiscount(null);
      }
      
    } catch (error) {
      console.error('[RechargeCredits] Code validation error:', error);
      setCodeError('Failed to validate code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setRedeemCode('');
    setCodeError('');
  };

  const handleProceedToCheckout = () => {
    if (selectedPlan) {
      setCurrentStep('checkout');
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    const plan = selectedPlanData;
    const finalPrice = calculateFinalPrice();
    
    try {
      // ============================================
      // BACKEND INTEGRATION POINT
      // ============================================
      // const orderResponse = await fetch('/api/payments/create-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     planId: plan.id,
      //     amount: finalPrice,
      //     currency: 'INR',
      //     redeemCode: appliedDiscount?.code || null
      //   }),
      // });
      // const orderData = await orderResponse.json();
      //
      // // Initialize payment gateway (Razorpay/Stripe/etc.)
      // const options = {
      //   key: process.env.RAZORPAY_KEY,
      //   amount: orderData.amount * 100, // in paise
      //   currency: 'INR',
      //   order_id: orderData.orderId,
      //   handler: async (response) => {
      //     const verifyResponse = await fetch('/api/payments/verify', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({
      //         orderId: orderData.orderId,
      //         paymentId: response.razorpay_payment_id,
      //         signature: response.razorpay_signature
      //       }),
      //     });
      //     const verifyData = await verifyResponse.json();
      //     if (verifyData.success) {
      //       addCredits(plan.credits);
      //       setCurrentStep('success');
      //     }
      //   }
      // };
      // const razorpay = new window.Razorpay(options);
      // razorpay.open();
      // ============================================

      // Mock payment processing
      console.log('[RechargeCredits] Processing payment:', { plan, finalPrice, discount: appliedDiscount });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success
      addCredits(plan.credits);
      setPurchasedPlan(plan);
      setCurrentStep('success');
      
      console.log('[RechargeCredits] Payment successful. Credits added:', plan.credits);
      
    } catch (error) {
      console.error('[RechargeCredits] Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (currentStep === 'checkout') {
                setCurrentStep('select');
              } else {
                navigate('/dashboard/user');
              }
            }}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {currentStep === 'select' && 'Recharge Credits'}
              {currentStep === 'checkout' && 'Checkout'}
              {currentStep === 'success' && 'Payment Complete'}
            </h1>
            <p className="text-gray-400 mt-1">
              {currentStep === 'select' && 'Choose a plan that fits your investigation needs'}
              {currentStep === 'checkout' && 'Review your order and apply discount codes'}
              {currentStep === 'success' && 'Your credits have been added'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        {currentStep !== 'success' && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep === 'select' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>
              <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-sm font-medium">Select Plan</span>
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep === 'checkout' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>
              <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">2</span>
              <span className="text-sm font-medium">Checkout</span>
            </div>
          </div>
        )}

        {/* Current Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Balance</p>
                <p className="text-4xl font-bold text-amber-300">{credits}</p>
                <p className="text-xs text-gray-500">credits available</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Never Expires</p>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Secure Payment</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Instant Credit</p>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Plan Selection */}
          {currentStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Plans Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-white flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Most Popular
                      </div>
                    )}
                    
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                    </div>
                    <p className="text-lg text-amber-400 font-bold mt-2">{plan.credits} Credits</p>
                    <p className="text-sm text-gray-500 mt-1">₹{(plan.price / plan.credits).toFixed(2)} per credit</p>
                    
                    {selectedPlan === plan.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Continue Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
              >
                <motion.button
                  whileHover={{ scale: selectedPlan ? 1.02 : 1 }}
                  whileTap={{ scale: selectedPlan ? 0.98 : 1 }}
                  onClick={handleProceedToCheckout}
                  disabled={!selectedPlan}
                  className={`px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${
                    selectedPlan
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: Checkout */}
          {currentStep === 'checkout' && selectedPlanData && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              {/* Order Summary Card */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-400" />
                  Order Summary
                </h2>
                
                {/* Selected Plan */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedPlanData.color} flex items-center justify-center`}>
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{selectedPlanData.name} Pack</h3>
                      <p className="text-amber-400 font-semibold">{selectedPlanData.credits} Credits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">₹{selectedPlanData.price}</p>
                      <p className="text-xs text-gray-500">₹{(selectedPlanData.price / selectedPlanData.credits).toFixed(2)}/credit</p>
                    </div>
                  </div>
                </div>

                {/* Redeem Code Section */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-5 h-5 text-violet-400" />
                    <h3 className="font-semibold text-white">Have a Redeem Code?</h3>
                  </div>
                  
                  {!appliedDiscount ? (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={redeemCode}
                          onChange={(e) => {
                            setRedeemCode(e.target.value.toUpperCase());
                            setCodeError('');
                          }}
                          placeholder="Enter code (e.g., NEWUSER10)"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleApplyRedeemCode}
                        disabled={!redeemCode.trim() || isValidatingCode}
                        className="px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isValidatingCode ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          'Apply'
                        )}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">{appliedDiscount.code}</span>
                        <span className="text-gray-400">
                          ({appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% off` : `₹${appliedDiscount.value} off`})
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveDiscount}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                  
                  {codeError && (
                    <p className="mt-2 text-sm text-red-400">{codeError}</p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{selectedPlanData.price}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>
                        -{appliedDiscount.type === 'percentage' 
                          ? `₹${Math.round(selectedPlanData.price * appliedDiscount.value / 100)}`
                          : `₹${appliedDiscount.value}`
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-white pt-3 border-t border-white/10">
                    <span>Total</span>
                    <span className="text-amber-400">₹{calculateFinalPrice()}</span>
                  </div>
                </div>
              </div>

              {/* New Balance Preview */}
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Balance after purchase</span>
                  <span className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {credits + selectedPlanData.credits} credits
                  </span>
                </div>
              </div>

              {/* Proceed to Payment Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProceedToPayment}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Payment Gateway
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              {/* Payment Security Info */}
              <p className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Secured by 256-bit SSL encryption
              </p>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto p-12 rounded-3xl bg-white/5 border border-white/10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-gray-400 mb-6">
                {purchasedPlan?.credits} credits have been added to your account
              </p>
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <p className="text-sm text-gray-400">New Balance</p>
                <p className="text-4xl font-bold text-emerald-400 flex items-center justify-center gap-2">
                  <Zap className="w-8 h-8" />
                  {credits} credits
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/user')}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold"
              >
                Back to Dashboard
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Methods Info */}
        {currentStep !== 'success' && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p className="flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-400" />
                SSL Secured
              </span>
              <span>•</span>
              <span>UPI, Cards, Net Banking accepted</span>
              <span>•</span>
              <span>Instant credit delivery</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargeCredits;
