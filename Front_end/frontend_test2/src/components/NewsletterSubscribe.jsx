import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, BellRing, Trash2, CheckCircle2 } from 'lucide-react';
import OtpModal from './OtpModal';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios'; // Make sure this is the correct axios instance path

export default function NewsletterSubscribe({ showNotification }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState(false); // Thêm state quản lý lỗi chưa đăng nhập
  

  // Subscription states
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isUnsubscribeModalOpen, setIsUnsubscribeModalOpen] = useState(false); // New state for unsubscribe confirmation modal
  
  // Custom WebSocket Hook
  const { isConnected, messages } = useWebSocket();

  // Hàm gọi API check trạng thái đăng ký của user hiện tại
  const fetchSubscriptionStatus = async (showLoading = true) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsSubscribed(false);
      setSubscribedEmail('');
      setAuthError(false);
      setIsCheckingStatus(false);
      return;
    }
    
    if (showLoading) setIsCheckingStatus(true); // Hiển thị trạng thái loading mượt mà để tránh chớp form nhập
    
    try {
      const response = await api.get('/api/subscribe/status');
      if (response.data.subscribed) {
        setIsSubscribed(true);
        setSubscribedEmail(response.data.email);
      } else {
        setIsSubscribed(false);
        setSubscribedEmail('');
      }
    } catch (error) {
      console.error('Failed to fetch subscription status', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Chạy lần đầu khi load trang
  useEffect(() => {
    const loadStatus = async () => {
      await fetchSubscriptionStatus();
    };
    loadStatus();
  }, []);

  // Lắng nghe sự thay đổi của token (khi User Login hoặc Logout) để cập nhật UI lập tức
  useEffect(() => {
    let lastToken = localStorage.getItem('accessToken');
    
    const checkTokenChange = () => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken !== lastToken) {
        const wasLoggedOut = !lastToken && currentToken; // Đánh dấu vừa đăng nhập
        lastToken = currentToken;
        fetchSubscriptionStatus(wasLoggedOut); // Chỉ bật loading nếu vừa chuyển từ logout sang login
      }
    };

    // Lắng nghe qua custom event và storage (nếu thao tác ở tab khác)
    window.addEventListener('storage', checkTokenChange);
    window.addEventListener('auth:changed', checkTokenChange);
    window.addEventListener('auth:login', checkTokenChange);
    window.addEventListener('auth:logout', checkTokenChange);

    return () => {
      window.removeEventListener('storage', checkTokenChange);
      window.removeEventListener('auth:changed', checkTokenChange);
      window.removeEventListener('auth:login', checkTokenChange);
      window.removeEventListener('auth:logout', checkTokenChange);
    };
  }, []);

  // Listen for WebSocket success message from STOMP
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.message === 'Subscription successful' && latestMessage.email === email) {
        setTimeout(() => {
          setIsSubscribed(true);
          setSubscribedEmail(latestMessage.email);
          setIsOtpModalOpen(false); // Close modal if open
        }, 0);
      }
    }
  }, [messages, email]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Check Login Status from localStorage/accessToken
    const isLoggedIn = !!localStorage.getItem('accessToken');
    if (!isLoggedIn) {
      setAuthError(true); // Hiển thị thanh thông báo lỗi đẹp mắt
      // Tự động tắt thông báo sau 3.5s
      setTimeout(() => setAuthError(false), 3500);
      return;
    }

    setAuthError(false);
    setIsSubmitting(true);
    
    try {
      // Call API to send OTP
      await api.post('/api/subscribe/request', { email });
      setIsOtpModalOpen(true);
    } catch (error) {
      console.error('Failed to request OTP:', error);
      showNotification(error.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otpString) => {
    setIsVerifying(true);
    setOtpError('');
    
    try {
      // Call API to verify OTP
      await api.post('/api/subscribe/verify', { email, otp: otpString });
      
      // Fallback update in case WebSocket is slow/fails
      setIsSubscribed(true);
      setSubscribedEmail(email);
      setIsOtpModalOpen(false);
      
    } catch (error) {
      setOtpError(error.response?.data?.message || 'Xác thực thất bại');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnsubscribeConfirm = async () => {
    setIsUnsubscribeModalOpen(false); // Close modal
    setIsUnsubscribing(true);
    try {
      await api.delete('/api/subscribe/unsubscribe');
      setIsSubscribed(false);
      setSubscribedEmail('');
      setEmail('');
      showNotification('Hủy đăng ký nhận thông báo thành công!', 'success');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      showNotification(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đăng ký. Vui lòng thử lại.', 'error');
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const handleUnsubscribe = () => {
    setIsUnsubscribeModalOpen(true); // Open confirmation modal
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto my-12 p-1">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
      
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
            <BellRing size={28} />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            Nhận Thông Báo Sự Kiện
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md">
            Đăng ký email của bạn để không bỏ lỡ bất kỳ cập nhật và sự kiện quan trọng nào từ chúng tôi.
          </p>
        </div>

        {!isCheckingStatus && (
          <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 p-3 rounded-xl text-sm font-medium text-center shadow-sm overflow-hidden"
                >
                  Vui lòng đăng nhập để có thể đăng ký nhận thông báo sự kiện!
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div 
                  key="subscribed"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm w-full"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <CheckCircle2 className="text-green-600 dark:text-green-400 flex-shrink-0" size={24} />
                    <div className="flex flex-col truncate">
                      <span className="text-sm text-green-800/70 dark:text-green-400/70 font-medium">Đang nhận thông báo qua:</span>
                      <span className="font-semibold text-green-900 dark:text-green-300 truncate">{subscribedEmail}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isUnsubscribing}
                    title="Hủy đăng ký"
                    className="flex-shrink-0 p-3 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  key="subscribeForm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSubscribe} 
                  className="flex w-full flex-col gap-3 sm:relative sm:flex-row sm:items-center sm:gap-0"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    required
                    className="w-full min-w-0 px-5 py-4 sm:pl-6 sm:pr-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 font-medium text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] disabled:opacity-70 sm:absolute sm:right-2 sm:top-2 sm:bottom-2 sm:w-auto sm:py-0 group"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Đang gửi...</span>
                    ) : (
                      <>
                        <span>Gửi</span>
                        <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Connection Status Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400">Trạng thái:</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${isConnected ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'Live' : 'Mất kết nối'}
          </div>
        </div>
      </div>

      <OtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        email={email}
        onVerify={handleVerifyOtp}
        isVerifying={isVerifying}
        error={otpError}
      />

      {/* Unsubscribe Confirmation Modal */}
      <AnimatePresence>
        {isUnsubscribeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl max-w-sm w-full text-center"
            >
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Xác nhận hủy đăng ký</h4>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Bạn có chắc chắn muốn hủy nhận thông báo sự kiện không?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsUnsubscribeModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUnsubscribeConfirm}
                  className="px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                  disabled={isUnsubscribing}
                >
                  {isUnsubscribing ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
