import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ChevronRight,
  Sun,
  Moon,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Cpu,
  Battery,
  Volume2,
  ShieldCheck,
  Send,
  Bot,
  MessageSquare,
  ArrowUp,
  LogIn,
  LogOut, // Added LogOut icon
  User,
  Lock,
  Eye,
  EyeOff,
  Heart,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import api from "../api/axios"; // Import the configured axios instance
import FavoriteProducts from "../components/FavoriteProducts"; // Import FavoriteProducts component
import heroImage from "../assets/hero.png";
// NotificationBar is handled by App.jsx, no need to import here

// --- DATA: LOGO MARQUEE ---
const FacebookIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.99h-2.4V12h2.4V9.4c0-2.37 1.41-3.68 3.56-3.68 1.03 0 2.1.18 2.1.18v2.31h-1.18c-1.16 0-1.52.72-1.52 1.46V12h2.59l-.41 2.88h-2.18v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);

const InstagramIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 2.75A5.25 5.25 0 1 1 6.75 12 5.26 5.26 0 0 1 12 6.75Zm0 2A3.25 3.25 0 1 0 15.25 12 3.25 3.25 0 0 0 12 8.75ZM18.5 5.5a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 18.5 5.5Z" />
  </svg>
);

const YoutubeIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M21.8 8.04a3 3 0 0 0-2.12-2.12C17.82 5.5 12 5.5 12 5.5s-5.82 0-7.68.42A3 3 0 0 0 2.2 8.04 31.4 31.4 0 0 0 1.8 12a31.4 31.4 0 0 0 .4 3.96 3 3 0 0 0 2.12 2.12c1.86.42 7.68.42 7.68.42s5.82 0 7.68-.42a3 3 0 0 0 2.12-2.12A31.4 31.4 0 0 0 22.2 12a31.4 31.4 0 0 0-.4-3.96ZM10 15.2V8.8L15.5 12 10 15.2Z" />
  </svg>
);

const LinkedinIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M6.94 6.5A1.94 1.94 0 1 1 5 4.56 1.94 1.94 0 0 1 6.94 6.5ZM5.25 8.75h3.38V20H5.25ZM10.13 8.75h3.24v1.54h.05a3.55 3.55 0 0 1 3.2-1.76c3.43 0 4.06 2.26 4.06 5.2V20h-3.38v-5.02c0-1.2-.02-2.75-1.68-2.75-1.69 0-1.95 1.32-1.95 2.66V20h-3.54Z" />
  </svg>
);

const NewsletterSubscribe = lazy(() => import("../components/NewsletterSubscribe"));

const LOGOS = [
  {
    name: "Procure",
    src: "https://svgl.app/library/procure.svg",
    gradient: "from-blue-500/20 to-indigo-500/10",
  },
  {
    name: "Shopify",
    src: "https://svgl.app/library/shopify.svg",
    gradient: "from-yellow-400/20 to-orange-500/10",
  },
  {
    name: "Blender",
    src: "https://svgl.app/library/blender.svg",
    gradient: "from-blue-400/20 to-cyan-500/10",
  },
  {
    name: "Figma",
    src: "https://svgl.app/library/figma.svg",
    gradient: "from-purple-500/20 to-pink-500/10",
  },
  {
    name: "Spotify",
    src: "https://svgl.app/library/spotify.svg",
    gradient: "from-pink-500/20 to-rose-500/10",
  },
  {
    name: "Lottielab",
    src: "https://svgl.app/library/lottielab.svg",
    gradient: "from-yellow-400/20 to-emerald-500/10",
  },
  {
    name: "Google Cloud",
    src: "https://svgl.app/library/google-cloud.svg",
    gradient: "from-sky-400/20 to-blue-500/10",
  },
  {
    name: "Bing",
    src: "https://svgl.app/library/bing.svg",
    gradient: "from-cyan-400/20 to-teal-500/10",
  },
];

export default function LandingPage({
  showNotification,
  isLoggedIn,
  onLoginSuccess,
  onLogout,
  setIsLoading,
  favorites,
  setFavorites,
}) {
  // States quản lý tính năng nâng cao
  const [darkMode, setDarkMode] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [products, setProducts] = useState([]); // State to store all product specifications
  const [currentProduct, setCurrentProduct] = useState(null); // State to store the currently displayed product
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [selectedColor, setSelectedColor] = useState("Onyx Black");
  const [selectedSize, setSelectedSize] = useState("Medium");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeSpecTab, setActiveSpecTab] = useState("dimensions");
  const pendingFavoriteIdsRef = useRef(new Set());
  const pendingCartItemIdsRef = useRef(new Set());

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }, [setLoginForm]);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true); // Set loading to true
      try {
        const response = await api.post("/auth/login", loginForm);
        localStorage.setItem("accessToken", response.data.accessToken);
        onLoginSuccess();
        setIsLoginOpen(false);
        showNotification("Login successful!", "success");
      } catch (error) {
        console.error("Login failed:", error);
        showNotification(
          error.response?.data?.message || "Login failed!",
          "error",
        );
      } finally {
        setIsLoading(false); // Set loading to false
      }
    },
    [loginForm, onLoginSuccess, setIsLoading, showNotification],
  );

  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true); // Set loading to true
      try {
        await api.post("/auth/register", loginForm);
        showNotification("Registration successful! Please log in.", "success");
        setAuthMode("login");
      } catch (error) {
        console.error("Registration failed:", error);
        showNotification(
          error.response?.data?.message || "Registration failed!",
          "error",
        );
      } finally {
        setIsLoading(false); // Set loading to false
      }
    },
    [loginForm, setIsLoading, showNotification, setAuthMode],
  );

  useEffect(() => {
    const openLoginForm = () => {
      setAuthMode("login");
      setIsLoginOpen(true);
      showNotification("Your session expired. Please log in again.", "info");
    };

    window.addEventListener("auth:login-required", openLoginForm);
    return () =>
      window.removeEventListener("auth:login-required", openLoginForm);
  }, [showNotification, setAuthMode, setIsLoginOpen]);

  useEffect(() => {
    let isMounted = true;

    if (!isLoggedIn) {
      setCartCount(0);
      setCartItems([]);
      return () => {
        isMounted = false;
      };
    }

    const fetchCart = async () => {
      try {
        const response = await api.get("/cart");
        if (!isMounted) return;

        setCartCount(response.data?.totalQuantity || 0);
        setCartItems(response.data?.items || []);
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      }
    };

    fetchCart();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        const nextProducts = Array.isArray(response.data) ? response.data : [];

        if (!isMounted) {
          return;
        }

        setProducts(nextProducts);
        setCurrentProduct((current) => current || nextProducts[0] || null);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        if (isMounted) {
          showNotification("Failed to load products.", "error");
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [showNotification]);

  // Tracking Scroll để làm hiệu ứng Điện thoại 3D lướt lên & nghiêng góc
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const scrollToTop = () => {
      const forceTop = () =>
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      forceTop();
      requestAnimationFrame(forceTop);
      requestAnimationFrame(() => {
        forceTop();
        setTimeout(forceTop, 100);
      });
      setTimeout(forceTop, 250);
    };

    const timer = setTimeout(scrollToTop, 0);

    return () => {
      clearTimeout(timer);
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollHeight = doc.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setShowBackToTop(progress >= 0.7);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Khớp tọa độ biến đổi 3D dựa trên khoảng cuộn chuột.
  // Dùng spring để khi scroll xuống/lên điện thoại nghiêng chậm, mượt và không bị giật.
  const smoothPhone = { stiffness: 70, damping: 24, mass: 0.8 };
  const phoneX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 70]),
    smoothPhone,
  );
  const phoneY = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -42]),
    smoothPhone,
  );
  const phoneRotateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [8, 18]),
    smoothPhone,
  );
  const phoneRotateY = useSpring(
    useTransform(scrollYProgress, [0, 1], [-10, -30]),
    smoothPhone,
  );
  const phoneRotateZ = useSpring(
    useTransform(scrollYProgress, [0, 1], [3, 13]),
    smoothPhone,
  );
  const phoneScale = useSpring(
    useTransform(scrollYProgress, [0, 1], [1, 1.06]),
    smoothPhone,
  );
  const headerX = useTransform(scrollYProgress, [0, 1], [0, 10]);
  const headerY = useTransform(scrollYProgress, [0, 1], [0, -2]);

  const toggleDarkMode = useCallback(() => setDarkMode(!darkMode), [darkMode]);

  const handleAddToCart = useCallback(async () => {
    if (!currentProduct) {
      showNotification(
        "Product details not loaded yet. Please try again.",
        "error",
      );
      return;
    }

    if (!isLoggedIn) {
      setAuthMode("login");
      setIsLoginOpen(true);
      showNotification("Please log in to add products to cart.", "info");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/cart/add", {
        productId: currentProduct.productId,
        quantity: 1,
        selectedColor,
        selectedSize,
      });

      setCartCount(response.data?.totalQuantity ?? ((prev) => prev + 1));
      setCartItems(response.data?.items || []);
      setIsCartOpen(true);
      showNotification(
        response.data?.message || "Product added to cart",
        "success",
      );
    } catch (error) {
      console.error("Add to cart failed:", error);
      if (error.response?.status === 401) {
        setAuthMode("login");
        setIsLoginOpen(true);
        showNotification("Please log in again before adding to cart.", "info");
      } else {
        showNotification(
          error.response?.data?.message || "Failed to add product to cart.",
          "error",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    currentProduct,
    isLoggedIn,
    selectedColor,
    selectedSize,
    setAuthMode,
    setIsLoginOpen,
    showNotification,
    setIsLoading,
    setCartCount,
    setCartItems,
    setIsCartOpen,
  ]);

  const handleUpdateCartItemQuantity = useCallback(
    async (cartItem, nextQuantity) => {
      if (!cartItem?.cartItemId) return;
      if (pendingCartItemIdsRef.current.has(cartItem.cartItemId)) return;

      pendingCartItemIdsRef.current.add(cartItem.cartItemId);

      const previousItems = [...cartItems];
      const previousCount = cartCount;

      const optimisticItems =
        nextQuantity <= 0
          ? cartItems.filter((item) => item.cartItemId !== cartItem.cartItemId)
          : cartItems.map((item) =>
              item.cartItemId === cartItem.cartItemId
                ? { ...item, quantity: nextQuantity }
                : item,
            );

      setCartItems(optimisticItems);
      setCartCount(
        optimisticItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
      );

      try {
        const response =
          nextQuantity <= 0
            ? await api.delete(`/cart/items/${cartItem.cartItemId}`)
            : await api.put(`/cart/items/${cartItem.cartItemId}`, {
                quantity: nextQuantity,
              });

        setCartItems(response.data?.items || []);
        setCartCount(response.data?.totalQuantity || 0);
        if (nextQuantity <= 0) {
          showNotification("Removed item from cart", "info");
        }
      } catch (error) {
        console.error("Update cart quantity failed:", error);
        setCartItems(previousItems);
        setCartCount(previousCount);
        if (error.response?.status === 401) {
          setAuthMode("login");
          setIsLoginOpen(true);
          showNotification("Please log in again before updating cart.", "info");
        } else {
          showNotification(
            error.response?.data?.message || "Failed to update cart.",
            "error",
          );
        }
      } finally {
        pendingCartItemIdsRef.current.delete(cartItem.cartItemId);
      }
    },
    [
      cartItems,
      cartCount,
      showNotification,
      setAuthMode,
      setIsLoginOpen,
      setCartItems,
      setCartCount,
    ],
  );

  const toggleFavorite = useCallback(
    async (productId) => {
      if (!isLoggedIn) {
        showNotification("Please log in to add favorites.", "info");
        return;
      }

      if (pendingFavoriteIdsRef.current.has(productId)) {
        return;
      }

      pendingFavoriteIdsRef.current.add(productId);

      // Save previous state for rollback
      const previousFavorites = [...favorites];

      // Optimistic Update
      const isFav = favorites.some((p) => p.productId === productId);
      if (isFav) {
        // Optimistically remove from favorites state
        setFavorites(favorites.filter((p) => p.productId !== productId));
        // Show notification immediately
        showNotification("Removed from favorites", "info");
      } else {
        // Optimistically add to favorites state
        const productToAdd = products.find((p) => p.productId === productId);
        if (productToAdd) {
          setFavorites([...favorites, productToAdd]);
        }
        // Show notification immediately
        showNotification("Added to favorites", "success");
      }

      try {
        if (isFav) {
          await api.post(`/favorites/remove?productId=${productId}`);
        } else {
          await api.post(`/favorites/add?productId=${productId}`);
        }
      } catch (error) {
        console.error("Favorite toggle failed:", error);
        showNotification("Failed to update favorites.", "error");
        // Rollback to previous state on failure
        setFavorites(previousFavorites);
      } finally {
        pendingFavoriteIdsRef.current.delete(productId);
      }
    },
    [isLoggedIn, showNotification, favorites, setFavorites, products],
  );

  const productButtons = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return <p className="text-sm text-slate-500">No products available.</p>;
    }
    return products.map((product) => (
      <button
        key={product.productId}
        onClick={() => setCurrentProduct(product)}
        className={twMerge(
          "cursor-pointer text-xs px-4 py-2 rounded-full border transition-all duration-300 font-medium",
          currentProduct?.productId === product.productId
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
            : "border-slate-500/20 hover:border-slate-500/40",
        )}
      >
        {product.productName}
      </button>
    ));
  }, [products, currentProduct]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0,
    );
  }, [cartItems]);

  return (
    <div
      className={twMerge(
        "relative w-full min-h-screen overflow-x-hidden transition-colors duration-500",
        darkMode
          ? "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_22%),linear-gradient(135deg,#04110d_0%,#071611_36%,#090f14_72%,#040507_100%)] text-slate-100"
          : "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_28%),linear-gradient(135deg,#f8fffb_0%,#eef6f2_36%,#e8edf1_72%,#f7f8fa_100%)] text-slate-900",
      )}
    >
      {darkMode && (
        <>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.06),transparent_26%)]" />
            <div className="wave-layer wave-layer-1" />
            <div className="wave-layer wave-layer-2" />
            <div className="wave-layer wave-layer-3" />
          </div>
          <style>{`
            @keyframes waveDrift {
              0% { transform: translate3d(0, 0, 0) scale(1); }
              50% { transform: translate3d(-2%, 1.5%, 0) scale(1.03); }
              100% { transform: translate3d(0, 0, 0) scale(1); }
            }
            @keyframes waveDriftReverse {
              0% { transform: translate3d(0, 0, 0) scale(1.02); }
              50% { transform: translate3d(2%, -1.5%, 0) scale(1); }
              100% { transform: translate3d(0, 0, 0) scale(1.02); }
            }
            .wave-layer {
              position: absolute;
              inset: -15%;
              opacity: 0.22;
              filter: blur(28px);
              mix-blend-mode: screen;
              will-change: transform;
              pointer-events: none;
            }
            .wave-layer-1 {
              background:
                radial-gradient(circle at 20% 30%, rgba(16,185,129,0.18), transparent 18%),
                radial-gradient(circle at 50% 55%, rgba(59,130,246,0.10), transparent 22%),
                radial-gradient(circle at 80% 35%, rgba(34,197,94,0.14), transparent 18%);
              animation: waveDrift 12s ease-in-out infinite;
            }
            .wave-layer-2 {
              background:
                radial-gradient(circle at 30% 70%, rgba(16,185,129,0.12), transparent 20%),
                radial-gradient(circle at 60% 25%, rgba(20,184,166,0.10), transparent 18%),
                radial-gradient(circle at 85% 75%, rgba(16,185,129,0.12), transparent 20%);
              animation: waveDriftReverse 16s ease-in-out infinite;
            }
            .wave-layer-3 {
              background:
                linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.03) 45%, transparent 60%),
                linear-gradient(240deg, transparent 0%, rgba(16,185,129,0.05) 48%, transparent 66%);
              opacity: 0.18;
              animation: waveDrift 20s ease-in-out infinite;
            }
          `}</style>
        </>
      )}
      <header
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[40] w-full max-w-[1200px] px-3 sm:px-4 pt-[env(safe-area-inset-top)]"
      >
        <motion.nav
          style={{ x: headerX, y: headerY }}
          className={twMerge(
            "flex items-center justify-between px-4 sm:px-6 py-3 rounded-full border shadow-lg backdrop-blur-2xl transition-all will-change-transform",
            darkMode
              ? "bg-slate-900/80 border-slate-800 shadow-black/20"
              : "bg-white/90 border-slate-200/50 shadow-slate-100",
          )}
        >
          {/* Logo Placeholder */}
          <div className="flex items-center gap-2 font-display font-semibold text-lg tracking-tight">
            <span className="text-xl">✦</span> EpochLab
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="hover:opacity-70 transition-opacity">
              Features
            </a>
            <a href="#specs" className="hover:opacity-70 transition-opacity">
              Specifications
            </a>
            <a
              href="#configurator"
              className="hover:opacity-70 transition-opacity"
            >
              Configure
            </a>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Switch Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-500/10 transition-colors cursor-pointer"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Favorites Trigger */}
            <button
              onClick={() => setIsFavoritesOpen(true)}
              className="relative p-2 rounded-full hover:bg-slate-500/10 transition-colors cursor-pointer"
              aria-label="View favorite products"
            >
              <Heart
                className={twMerge(
                  "w-4 h-4",
                  favorites.length > 0 && "fill-current text-rose-500",
                )}
              />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-slate-500/10 transition-colors cursor-pointer"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            <button
              onClick={() => {
                if (isLoggedIn) {
                  onLogout();
                } else {
                  setAuthMode("login");
                  setIsLoginOpen(true);
                }
              }}
              className={twMerge(
                "cursor-pointer inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all border",
                darkMode
                  ? "bg-white text-slate-900 border-white hover:bg-emerald-50"
                  : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800",
              )}
              aria-label={isLoggedIn ? "Logout" : "Login or Register"}
            >
              {isLoggedIn ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </>
              )}
            </button>
          </div>
        </motion.nav>
      </header>

      <section
        ref={heroRef}
        className="relative z-10 w-full max-w-[1400px] mx-auto pt-24 sm:pt-28 px-3 sm:px-4"
        aria-labelledby="hero-heading"
      >
        <div
          className={twMerge(
            "relative w-full rounded-[28px] sm:rounded-[48px] border overflow-hidden min-h-[650px] flex flex-col md:flex-row items-center justify-between p-5 sm:p-8 md:p-16 transition-all",
            darkMode
              ? "bg-[linear-gradient(135deg,rgba(8,15,12,0.84),rgba(6,11,14,0.7))] border-emerald-500/15 shadow-[0_0_80px_rgba(16,185,129,0.08)]"
              : "bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(247,250,248,0.82))] border-emerald-900/10 shadow-sm",
          )}
        >
          {/* Background Video Layer */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-40">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(34,197,94,0.08),transparent_22%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_20%)]" />
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260505_101331_74f9b798-3f00-4e86-8a01-377aa16ffeaa.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={heroImage}
              aria-hidden="true"
              className="w-full h-full object-cover scale-105"
            />
          </div>

          {/* Left Text Box */}
          <div className="relative z-20 flex-1 flex flex-col items-start max-w-xl">
            <span
              className={twMerge(
                "text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 border",
                darkMode
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-emerald-500/8 text-emerald-700 border-emerald-800/10",
              )}
            >
              ✦ Enterprise Intelligent Infrastructure
            </span>
            <h1 id="hero-heading" className="font-display text-[42px] md:text-[58px] font-medium leading-[1.05] tracking-tight mb-4">
              Foundation of the
              <br />
              new digital epoch
            </h1>
            <p
              className={twMerge(
                "font-sans text-[14px] md:text-[15px] leading-relaxed mb-6",
                darkMode ? "text-slate-400" : "text-slate-500",
              )}
            >
              Designing products, powering ecosystems and laying the foundation
              of a decentralized web for enterprises, builders and communities
              alike.
            </p>
            <a
              href="#configurator"
              className={twMerge(
                "px-6 py-3 rounded-full text-sm font-medium transition-transform active:scale-95 shadow-md",
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white",
              )}
            >
              Contact Us
            </a>
          </div>

          {/* Right Box: 3D Perspective Phone Animation Driven by Scroll */}
          <div className="relative w-full md:w-[450px] h-[290px] sm:h-[350px] md:h-full flex items-center justify-center perspective-[1200px] z-10 mt-8 md:mt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{
                x: phoneX,
                y: phoneY,
                rotateX: phoneRotateX,
                rotateY: phoneRotateY,
                rotateZ: phoneRotateZ,
                scale: phoneScale,
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
              className="relative w-[190px] sm:w-[220px] md:w-[240px] h-[380px] sm:h-[430px] md:h-[480px] rounded-[36px] sm:rounded-[48px] shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_24px_70px_rgba(16,185,129,0.22),0_10px_30px_rgba(0,0,0,0.18)] transition-shadow duration-300 border border-white/20 bg-white/80 backdrop-blur-sm"
            >
              {/* CHỖ THAY ẢNH ĐIỆN THOẠI CHÍNH (HERO 3D SCROLL IMAGE) */}
              <img
                src={
                  currentProduct?.imageUrl ||
                  heroImage ||
                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1400&auto=format&fit=crop"
                }
                alt={
                  currentProduct?.productName ||
                  "Cinematic Ultra Premium Smartphone Hardware Device"
                }
                width="240"
                height="480"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-full object-cover rounded-[36px] sm:rounded-[48px] bg-black brightness-95 contrast-125 saturate-90"
              />
              {/* Glow Overlay Ambient Reflection Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_44%,rgba(16,185,129,0.34),transparent_28%),radial-gradient(circle_at_60%_58%,rgba(34,197,94,0.22),transparent_20%),radial-gradient(circle_at_40%_28%,rgba(255,255,255,0.06),transparent_18%),linear-gradient(145deg,rgba(255,255,255,0.04),transparent_42%)] pointer-events-none rounded-[36px] sm:rounded-[48px]" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. SEAMLESS INFINITE MARQUEE LOGO SCROLLER */}
      <section className="mt-6 sm:mt-8 relative w-full overflow-hidden py-3 sm:py-4" aria-labelledby="logo-marquee-heading">
        <h2 id="logo-marquee-heading" className="sr-only">Client Logos</h2>
        <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused]">
          {[...LOGOS, ...LOGOS].map((logo, idx) => (
            <div
              key={idx}
              className={twMerge(
                "group relative h-20 w-36 shrink-0 flex items-center justify-center rounded-full border transition-all overflow-hidden cursor-pointer",
                darkMode
                  ? "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  : "bg-white border-slate-200/60 hover:border-slate-300",
              )}
            >
              <div
                className={twMerge(
                  "absolute inset-0 bg-gradient-to-br opacity-0 scale-150 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-out z-0",
                  logo.gradient,
                )}
              />
              <img
                src={logo.src}
                alt={logo.name}
                width="48"
                height="48"
                loading="lazy"
                decoding="async"
                className="w-12 h-12 object-contain relative z-10 opacity-70 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert transition-all"
              />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 30s linear infinite; }
        `}</style>
      </section>

      {/* SECTION: TÍNH NĂNG NỔI BẬT (FEATURES SCROLLYTELLING) */}
      <section
        id="features"
        className="w-full max-w-[1200px] mx-auto px-4 py-16 sm:py-24"
      >
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(6,11,14,0.90),rgba(8,18,14,0.74))] px-6 py-10 sm:px-10 sm:py-14 shadow-[0_18px_80px_rgba(0,0,0,0.16)]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_30%)]" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-10 items-start">
            <div className="max-w-xl">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] px-3 py-1 rounded-full border border-emerald-500/15 bg-emerald-500/10 text-emerald-300"
              >
                Premium Capabilities
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
                className="font-display text-3xl md:text-5xl font-semibold mt-5 tracking-tight leading-[1.02]"
              >
                Premium capabilities built for modern infrastructure
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
                className={twMerge(
                  "mt-4 text-sm md:text-[15px] leading-relaxed max-w-lg",
                  darkMode ? "text-slate-400" : "text-slate-500",
                )}
              >
                A calmer, more refined surface with structured hierarchy,
                smoother rhythm, and subtle motion that appears on scroll
                instead of feeling constantly animated.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Cpu,
                  title: "AI Processing Core",
                  desc: "Low-latency computation built for rapid inference and adaptive workflows.",
                  accent: "from-cyan-500/18 to-blue-500/8",
                },
                {
                  icon: Battery,
                  title: "Power Efficiency",
                  desc: "Balanced runtime with consistent thermal behavior across long sessions.",
                  accent: "from-emerald-500/18 to-teal-500/8",
                },
                {
                  icon: Volume2,
                  title: "Spatial Audio",
                  desc: "Clean directional output with a focused, immersive acoustic profile.",
                  accent: "from-violet-500/18 to-fuchsia-500/8",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: 0.45,
                      ease: "easeOut",
                      delay: index * 0.08,
                    }}
                    className={twMerge(
                      "group rounded-[28px] border p-5 backdrop-blur-sm transition-all duration-300",
                      darkMode
                        ? "bg-white/5 border-white/10 hover:bg-white/7"
                        : "bg-white/85 border-slate-200/60 hover:bg-white",
                    )}
                  >
                    <div
                      className={twMerge(
                        "w-11 h-11 rounded-2xl flex items-center justify-center mb-5 border transition-transform duration-300 group-hover:scale-[1.03]",
                        `bg-gradient-to-br ${item.accent}`,
                        darkMode ? "border-white/10" : "border-slate-200/60",
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-display font-medium text-base mb-2">
                      {item.title}
                    </h3>
                    <p
                      className={twMerge(
                        "text-xs leading-relaxed",
                        darkMode ? "text-slate-400" : "text-slate-500",
                      )}
                    >
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: THÔNG SỐ KỸ THUẬT (SPECIFICATIONS TAB VIEW) */}
      <section
        id="specs"
        className={twMerge(
          "w-full py-14 sm:py-20 border-y",
          darkMode
            ? "bg-slate-950/20 border-slate-800"
            : "bg-slate-50/50 border-slate-200/60",
        )}
      >
        <div className="w-full max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">
              Technical Matrix
            </span>
            <h2 className="font-display text-3xl font-semibold mt-1 mb-4 tracking-tight">
              Clean specs, structured for fast scanning
            </h2>

            <button
              type="button"
              onClick={() =>
                currentProduct && toggleFavorite(currentProduct.productId)
              }
              className={twMerge(
                "mb-6 cursor-pointer inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.99]",
                currentProduct &&
                  favorites.some(
                    (p) => p.productId === currentProduct.productId,
                  )
                  ? "border-rose-500 bg-rose-500/10 text-rose-500"
                  : darkMode
                    ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
              aria-label={
                currentProduct &&
                favorites.some((p) => p.productId === currentProduct.productId)
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              title={
                currentProduct &&
                favorites.some((p) => p.productId === currentProduct.productId)
                  ? "Liked"
                  : "Add to favorites"
              }
            >
              <Heart
                className={twMerge(
                  "w-4 h-4",
                  currentProduct &&
                    favorites.some(
                      (p) => p.productId === currentProduct.productId,
                    ) &&
                    "fill-current",
                )}
              />
              {currentProduct &&
              favorites.some((p) => p.productId === currentProduct.productId)
                ? "Liked"
                : "Favorite"}
            </button>

            {/* Tab Controls */}
            <div className="flex gap-2 mb-6 border-b border-slate-500/10 pb-3">
              {["dimensions", "connectivity", "processing"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSpecTab(tab)}
                  className={twMerge(
                    "cursor-pointer capitalize px-4 py-2 rounded-full text-xs font-semibold transition-all",
                    activeSpecTab === tab
                      ? darkMode
                        ? "bg-white text-slate-900"
                        : "bg-slate-900 text-white"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Spec Lists Content */}
            <motion.div
              key={activeSpecTab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="space-y-4 text-sm font-sans"
            >
              {currentProduct && activeSpecTab === "dimensions" && (
                <>
                  <div className="flex justify-between py-2 border-b border-slate-500/10">
                    <span>Height</span>
                    <span className="font-semibold">
                      {currentProduct.heightMm} mm
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-500/10">
                    <span>Width</span>
                    <span className="font-semibold">
                      {currentProduct.widthMm} mm
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-500/10">
                    <span>Depth</span>
                    <span className="font-semibold">
                      {currentProduct.depthMm} mm
                    </span>
                  </div>
                </>
              )}
              {currentProduct && activeSpecTab === "connectivity" && (
                <>
                  <div className="flex justify-between py-2 border-b border-slate-500/10">
                    <span>Wireless Network</span>
                    <span className="font-semibold">
                      {currentProduct.wirelessNetwork}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-500/10">
                    <span>Protocols</span>
                    <span className="font-semibold">
                      {currentProduct.protocols}
                    </span>
                  </div>
                </>
              )}
              {currentProduct && activeSpecTab === "processing" && (
                <>
                  <div className="flex justify-between py-2 border-b border-slate-500/10">
                    <span>Chipset Architecture</span>
                    <span className="font-semibold">
                      {currentProduct.chipsetArch}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-500/10">
                    <span>Cores Matrix</span>
                    <span className="font-semibold">
                      {currentProduct.coresMatrix}
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Right Showcase Box */}
          <div className="relative w-full h-[350px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(6,11,14,0.92),rgba(7,18,14,0.84))] flex items-center justify-center">
            {/* CHỖ THAY ẢNH CHI TIẾT SẢN PHẨM HOẶC GÓC NGHIÊNG KHÁC (SPEC SHOWCASE IMAGE) */}
            {currentProduct && (
              <img
                src={
                  currentProduct.imageUrl ||
                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=900&auto=format&fit=crop"
                }
                alt={
                  currentProduct.productName ||
                  "Specifications Texture Close Up"
                }
                width="900"
                height="350"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="w-full h-full object-cover opacity-100 hover:scale-[1.02] transition-transform duration-500"
              />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.25))] pointer-events-none" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-200/90">
              <ShieldCheck className="w-3 h-3" /> Secure Enclave Certified
              Infrastructure
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: CẤU HÌNH ĐẶT HÀNG INTERACTIVE PRODUCT CONFIGURATOR */}
      <section
        id="configurator"
        className="w-full max-w-[1200px] mx-auto px-4 py-16 sm:py-24"
      >
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(6,11,14,0.86),rgba(8,18,14,0.76))] px-6 py-10 sm:px-10 sm:py-12 shadow-[0_18px_70px_rgba(0,0,0,0.14)]">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_30%)]" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="max-w-xl"
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] px-3 py-1 rounded-full border border-emerald-500/15 bg-emerald-500/10 text-emerald-300">
                Tailored Customization
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-5 tracking-tight leading-[1.04]">
                Build the order payload before checkout
              </h2>
              <p
                className={twMerge(
                  "mt-4 text-sm leading-relaxed max-w-lg",
                  darkMode ? "text-slate-400" : "text-slate-500",
                )}
              >
                A softer, more premium configurator layout with subtle motion,
                calmer spacing, and a cleaner visual hierarchy.
              </p>

              <div
                className={twMerge(
                  "mt-8 rounded-[28px] border p-5 sm:p-6 backdrop-blur-sm",
                  darkMode
                    ? "bg-white/5 border-white/10"
                    : "bg-white/85 border-slate-200/60 shadow-sm",
                )}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-60 block mb-3">
                      Choose Product
                    </label>
                    <div className="flex flex-wrap gap-2">{productButtons}</div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-60 block mb-3">
                      Choose Finish
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Onyx Black", "Frost White", "Aurora Teal"].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={twMerge(
                              "cursor-pointer text-xs px-4 py-2 rounded-full border transition-all duration-300 font-medium",
                              selectedColor === color
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                                : "border-slate-500/20 hover:border-slate-500/40",
                            )}
                          >
                            {color}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-60 block mb-3">
                      Size Factor
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Small", "Medium", "Large"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={twMerge(
                            "cursor-pointer text-xs px-4 py-2 rounded-full border transition-all duration-300 font-medium",
                            selectedSize === size
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                              : "border-slate-500/20 hover:border-slate-500/40",
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 active:scale-[0.99] transition-transform duration-300"
                  >
                    Add to Cart <ChevronRight className="w-4 h-4" />
                  </button>

                  <div
                    className={twMerge(
                      "text-[11px] leading-relaxed w-full sm:w-auto",
                      darkMode ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    Selected:{" "}
                    <span className="font-semibold text-emerald-400">
                      {currentProduct?.productName || "N/A"}
                    </span>{" "}
                    /{" "}
                    <span className="font-semibold text-emerald-400">
                      {selectedColor}
                    </span>{" "}
                    /{" "}
                    <span className="font-semibold text-emerald-400">
                      {selectedSize}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div
              className={twMerge(
                "relative overflow-hidden rounded-[30px] border p-6 sm:p-7 min-h-[320px] flex flex-col justify-between",
                darkMode
                  ? "bg-slate-950/30 border-white/10"
                  : "bg-white/80 border-slate-200/60 shadow-sm",
              )}
            >
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_24%),radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.08),transparent_20%)]" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-45 block mb-2">
                  Live Spec Preview
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-medium tracking-tight">
                  Configuration summary
                </h4>
              </div>

              <div className="relative z-10 mt-6 space-y-4">
                {[
                  ["Color", selectedColor],
                  ["Size", selectedSize],
                  ["Delivery", "Instant Webhook Dispatch"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={twMerge(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-300",
                      darkMode
                        ? "bg-white/5 border-white/10"
                        : "bg-slate-50/70 border-slate-200/60",
                    )}
                  >
                    <span className="text-xs uppercase tracking-[0.18em] opacity-55">
                      {label}
                    </span>
                    <span className="text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              <p
                className={twMerge(
                  "relative z-10 text-[11px] leading-relaxed mt-6",
                  darkMode ? "text-slate-400" : "text-slate-500",
                )}
              >
                Subtle motion, softer contrast, and a cleaner structure keep the
                section premium without feeling too aggressive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SUBSCRIBE SECTION */}
      <section className="w-full max-w-[1200px] mx-auto px-4 pb-20 sm:pb-24" aria-labelledby="newsletter-heading">
        <div
          className={twMerge(
            "rounded-[40px] p-8 md:p-16 border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8",
            darkMode
              ? "bg-slate-950/60 border-slate-800"
              : "bg-white border-slate-200/60 shadow-xl shadow-slate-100",
          )}
        >
          <div className="max-w-md">
            <h2 id="newsletter-heading" className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Stay updated with the next epoch
            </h2>
            <p
              className={twMerge(
                "text-xs leading-relaxed mt-2",
                darkMode ? "text-slate-400" : "text-slate-500",
              )}
            >
              Subscribe for high-throughput node releases, system updates, and
              architecture optimizations delivered directly to your client
              terminal.
            </p>
          </div>

          <div className="w-full max-w-sm">
            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-center text-xs font-medium"
              >
                ✦ Client Terminal Registration Confirmed! Thank you.
              </motion.div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubscribed(true);
                }}
                className="flex gap-2 w-full"
              >
                <label htmlFor="email-input" className="sr-only">Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="Enter client email endpoint..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={twMerge(
                    "flex-1 px-4 py-3 rounded-2xl text-xs border focus:outline-none focus:border-blue-500 transition-colors",
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-900",
                  )}
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl transition-transform active:scale-95 cursor-pointer"
                  aria-label="Subscribe to newsletter"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- AUTH MODAL: LOGIN FIRST, SWITCH TO REGISTER IF NEEDED --- */}
      <AnimatePresence>
        {isLoginOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={twMerge(
                "fixed left-1/2 top-1/2 z-[61] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[32px] border p-6 shadow-2xl",
                darkMode
                  ? "bg-slate-950/95 border-white/10 text-white shadow-black/40"
                  : "bg-white border-slate-200 text-slate-900 shadow-slate-300/50",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <LogIn className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {authMode === "login" ? "Đăng nhập" : "Đăng kí"}
                  </h3>
                  <p
                    className={twMerge(
                      "mt-2 text-xs leading-relaxed",
                      darkMode ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    {authMode === "login"
                      ? "Nhập tài khoản và mật khẩu để tiếp tục."
                      : "Tạo tài khoản mới chỉ với tài khoản và mật khẩu."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsLoginOpen(false);
                    setShowPassword(false);
                    setAuthMode("login");
                  }}
                  className="cursor-pointer rounded-full p-2 opacity-70 transition hover:bg-slate-500/10 hover:opacity-100"
                  aria-label="Đóng form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                className="mt-6 space-y-4"
                onSubmit={authMode === "login" ? handleLogin : handleRegister}
              >
                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] opacity-60">
                    Tài khoản
                  </span>
                  <div
                    className={twMerge(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors focus-within:border-emerald-500",
                      darkMode
                        ? "bg-slate-900 border-slate-800"
                        : "bg-slate-50 border-slate-200",
                    )}
                  >
                    <User className="h-4 w-4 text-emerald-400" />
                    <input
                      type="text"
                      name="username"
                      required
                      value={loginForm.username}
                      onChange={handleInputChange}
                      placeholder="Nhập tài khoản (không khoảng trắng)"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                      aria-label="Tài khoản"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] opacity-60">
                    Mật khẩu
                  </span>
                  <div
                    className={twMerge(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors focus-within:border-emerald-500",
                      darkMode
                        ? "bg-slate-900 border-slate-800"
                        : "bg-slate-50 border-slate-200",
                    )}
                  >
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={loginForm.password}
                      onChange={handleInputChange}
                      placeholder="Tối thiểu 6 ký tự, hoa, thường, số, đặc biệt"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                      aria-label="Mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="cursor-pointer rounded-full p-1 opacity-70 transition hover:opacity-100"
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.99]"
                >
                  <LogIn className="h-4 w-4" />
                  {authMode === "login" ? "Đăng nhập" : "Đăng kí"}
                </button>

                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={twMerge(
                      "w-full text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-80",
                      darkMode ? "text-emerald-300" : "text-emerald-700",
                    )}
                  >
                    Chưa có tài khoản? Bấm vào đây để đăng kí
                  </button>
                )}

                {authMode === "register" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={twMerge(
                      "w-full text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-80",
                      darkMode ? "text-emerald-300" : "text-emerald-700",
                    )}
                  >
                    Đã có tài khoản? Quay lại đăng nhập
                  </button>
                )}
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- E-COMMERCE MINI SIDEBAR CART PANEL (Tính năng điểm cộng) --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Dark blur background mask layer overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 cursor-pointer"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className={twMerge(
                "fixed top-0 right-0 bottom-0 w-full max-w-md shadow-2xl z-50 p-6 flex flex-col justify-between border-l",
                darkMode
                  ? "bg-slate-900 text-white border-slate-800"
                  : "bg-white text-slate-900 border-slate-200",
              )}
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-500/10 pb-4 mb-6">
                  <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> Your Configured Basket
                  </h3>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 hover:opacity-60 cursor-pointer"
                    aria-label="Close cart"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {cartItems.length > 0 ? (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.cartItemId}
                        className={twMerge(
                          "p-4 rounded-2xl border flex justify-between items-start gap-4",
                          darkMode
                            ? "bg-slate-950/40 border-slate-800"
                            : "bg-slate-50 border-slate-200",
                        )}
                      >
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {item.productName}
                          </h4>
                          <p className="text-[11px] opacity-60 mt-1">
                            Config: {item.selectedColor || "N/A"} /{" "}
                            {item.selectedSize || "N/A"}
                          </p>
                          <span className="text-xs font-semibold text-blue-500 block mt-2">
                            ${item.price}.00
                          </span>
                        </div>
                        <div className="flex items-center gap-2 border border-slate-500/20 rounded-lg px-2 py-1 bg-white/5">
                          <button
                            onClick={() =>
                              handleUpdateCartItemQuantity(
                                item,
                                (item.quantity || 0) - 1,
                              )
                            }
                            className="p-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                            aria-label={`Decrease quantity of ${item.productName}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateCartItemQuantity(
                                item,
                                (item.quantity || 0) + 1,
                              )
                            }
                            className="p-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                            aria-label={`Increase quantity of ${item.productName}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs opacity-50 text-center py-12">
                    No data payload configurations in memory stack.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-500/10 pt-4">
                <div className="flex justify-between items-center text-sm font-semibold mb-4">
                  <span>Subtotal Architecture Cost</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() =>
                    alert(
                      "Xác nhận đặt hàng payload thành công về hệ thống Spring Boot Mock!",
                    )
                  }
                  className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium text-center text-xs"
                >
                  Xác nhận đặt hàng (POST Payload)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- FLOATING AI CHATBOT SYSTEM PANEL (Tính năng điểm cộng) --- */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={twMerge(
              "fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-3 sm:right-6 w-[calc(100vw-1.5rem)] max-w-96 h-[70vh] max-h-[480px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden z-50 font-sans",
              darkMode
                ? "bg-slate-900 border-slate-800 shadow-black/40"
                : "bg-white border-slate-200 shadow-slate-200/60",
            )}
          >
            <div className="bg-[linear-gradient(135deg,rgba(10,18,28,0.98),rgba(13,24,35,0.96))] border-b border-white/10 p-4 text-white flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.30),rgba(34,197,94,0.12))] border border-emerald-400/20 shadow-[0_0_24px_rgba(16,185,129,0.18)]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
                    AI Assistant
                  </div>
                  <div className="text-xs text-slate-300/80">
                    Smart support panel
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 rounded-full cursor-pointer text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={twMerge(
                "flex-1 p-4 overflow-y-auto space-y-3 text-xs",
                darkMode
                  ? "bg-[linear-gradient(180deg,rgba(7,12,18,0.82),rgba(9,16,24,0.92))]"
                  : "bg-slate-50/70",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),rgba(34,197,94,0.10))] border border-emerald-400/15 text-emerald-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div
                  className={twMerge(
                    "max-w-[85%] rounded-3xl rounded-tl-md border px-4 py-3 shadow-sm leading-relaxed",
                    darkMode
                      ? "bg-white/6 border-white/10 text-slate-100 backdrop-blur-md"
                      : "bg-white border-slate-100 text-slate-700",
                  )}
                >
                  Xin chào! Tôi có thể hỗ trợ gì về thông số phần cứng, kết nối
                  API gRPC hay cấu hình cho hệ thống của ông không?
                </div>
              </div>
            </div>

            <div
              className={twMerge(
                "p-3 border-t flex gap-2",
                darkMode
                  ? "border-white/10 bg-[linear-gradient(180deg,rgba(8,14,20,0.92),rgba(10,18,26,0.98))]"
                  : "border-slate-200/70 bg-white/80",
              )}
            >
              <label htmlFor="chat-input" className="sr-only">Chat message</label>
              <input
                id="chat-input"
                type="text"
                placeholder="Ask about specifications..."
                className={twMerge(
                  "flex-1 border rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-400 transition-colors",
                  darkMode
                    ? "bg-slate-950/70 border-white/10 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400",
                )}
              />
              <button className="bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#0f766e)] text-white p-2.5 rounded-2xl hover:opacity-95 cursor-pointer shadow-[0_10px_24px_rgba(29,78,216,0.22)] transition-all active:scale-95"
              aria-label="Send message">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showBackToTop && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl z-40 cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}

      {/* Floating Messenger Toggle Bubble icon when panel is closed */}
      {!isChatOpen && (
        <motion.button
          onClick={() => setIsChatOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-3 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl z-40 cursor-pointer"
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
        </motion.button>
      )}

      {/* NEWSLETTER SUBSCRIBE SECTION */}
      <Suspense fallback={null}>
        <NewsletterSubscribe showNotification={showNotification} />
      </Suspense>

      {/* FOOTER */}
      <footer className="w-full max-w-[1200px] mx-auto px-4 pb-10 sm:pb-14 pt-6 sm:pt-10" aria-labelledby="footer-heading">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={twMerge(
            "relative overflow-hidden rounded-[36px] border px-6 py-10 sm:px-10 sm:py-12",
            darkMode
              ? "bg-[linear-gradient(135deg,rgba(6,11,14,0.92),rgba(8,18,14,0.82))] border-white/10"
              : "bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(245,249,247,0.92))] border-slate-200/70",
          )}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_30%)]" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.95fr_0.9fr] gap-8 lg:gap-10 items-start">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] px-3 py-1 rounded-full border border-emerald-500/15 bg-emerald-500/10 text-emerald-300">
                Contact Information
              </span>
              <h2 id="footer-heading" className="font-display text-3xl sm:text-4xl font-semibold mt-5 tracking-tight leading-[1.02]">
                Get in touch for consultation and support
              </h2>
              <p
                className={twMerge(
                  "mt-4 text-sm leading-relaxed max-w-xl",
                  darkMode ? "text-slate-400" : "text-slate-500",
                )}
              >
                The details below include our address, phone number, email, and
                social channels so customers can easily connect with us.
              </p>
            </div>

            <div
              className={twMerge(
                "rounded-[30px] border p-6 sm:p-7",
                darkMode
                  ? "bg-slate-950/30 border-white/10"
                  : "bg-white/80 border-slate-200/60 shadow-sm",
              )}
            >
              <h3 className="font-display text-xl font-semibold mb-5">
                Contact Details
              </h3>
              <address className="space-y-4 text-sm not-italic">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-400">●</span>
                  <div>
                    <p className="font-semibold">Address</p>
                    <p
                      className={darkMode ? "text-slate-400" : "text-slate-500"}
                    >
                      123 Technology Street, An Phu Ward, Thu Duc City, Ho Chi
                      Minh City
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-400">●</span>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p
                      className={darkMode ? "text-slate-400" : "text-slate-500"}
                    >
                      0901 234 567
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-400">●</span>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p
                      className={darkMode ? "text-slate-400" : "text-slate-500"}
                    >
                      support@epochlab.vn
                    </p>
                  </div>
                </div>
              </address>
            </div>

            <div
              className={twMerge(
                "rounded-[30px] border p-6 sm:p-7",
                darkMode
                  ? "bg-slate-950/30 border-white/10"
                  : "bg-white/80 border-slate-200/60 shadow-sm",
              )}
            >
              <h3 className="font-display text-xl font-semibold mb-5">
                Social Media
              </h3>
              <div className="space-y-3 text-sm">
                <a
                  href="https://forum.uit.edu.vn/tag/internship"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5 transition-colors"
                >
                  <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                  <span>Facebook</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-[#E4405F]" />
                  <span>Instagram</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5 transition-colors"
                >
                  <YoutubeIcon className="w-4 h-4 text-[#FF0000]" />
                  <span>YouTube</span>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5 transition-colors"
                >
                  <LinkedinIcon className="w-4 h-4 text-[#0A66C2]" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </footer>

      {/* FAVORITES SIDEBAR */}
      <AnimatePresence>
        {isFavoritesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70]"
            onClick={() => setIsFavoritesOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isFavoritesOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[71] h-full w-full max-w-md"
          >
            <FavoriteProducts
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              darkMode={darkMode}
              onClose={() => setIsFavoritesOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
