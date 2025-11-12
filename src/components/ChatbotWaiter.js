import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, ShoppingCart, Coffee, Utensils, Wine, Cake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatbotWaiter({ products, onAddToCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! 👋 I'm Alex, your personal AI waiter ! How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      options: [
        { id: 'menu', text: ' Browse Menu', icon: '📋' },
        { id: 'recommend', text: ' Get Recommendations', icon: '⭐' },
        { id: 'popular', text: ' Popular Items', icon: '🔥' },
        { id: 'order', text: ' How to Order', icon: '🛒' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Show welcome animation on first load
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowWelcome(false);
    }
  }, []);

const scrollToMessageTop = () => {
  const chatContainer = document.querySelector('.chat-messages-container');
  if (chatContainer) {
    chatContainer.scrollTop = 0;
  }
};

useEffect(() => {
  // Whenever a new message is added
  const lastMessage = messages[messages.length - 1];
  const chatContainer = document.querySelector('.chat-messages-container');

  if (lastMessage?.sender === 'bot' && chatContainer) {
    // Scroll to top smoothly when bot replies
    chatContainer.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (chatContainer) {
    // Otherwise keep normal bottom scroll
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}, [messages]);


  useEffect(() => {
    if (!isOpen && messages.length > 1 && messages[messages.length - 1].sender === 'bot') {
      setHasNewMessage(true);
    }
  }, [messages, isOpen]);

  const getCategoryIcon = (category) => {
    const icons = {
      coffee: <Coffee size={16} />,
      food: <Utensils size={16} />,
      drink: <Wine size={16} />,
      dessert: <Cake size={16} />
    };
    return icons[category] || '📦';
  };

  const generateBotResponse = (userMessage, isOptionClick = false) => {
    const lowerMessage = userMessage.toLowerCase();
    let response = { text: '', options: [] };

    // Greeting responses
    if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) {
      response.text = "Hello! 😊 Welcome to CoffAI! What would you like to explore?";
      response.options = [
        { id: 'menu', text: '📋 View Full Menu', icon: '📋' },
        { id: 'recommend', text: '⭐ Get Recommendations', icon: '⭐' },
        { id: 'categories', text: '🏷️ Browse Categories', icon: '🏷️' }
      ];
      return response;
    }

    // Menu browsing
    if (lowerMessage.match(/\b(menu|browse|show|view)\b/) || userMessage === 'menu') {
      response.text = "Here are our categories. What would you like to see?";
      const categories = [...new Set(products.map(p => p.category))];
      response.options = categories.map(cat => ({
        id: `cat_${cat}`,
        text: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        icon: cat === 'coffee' ? '☕' : cat === 'food' ? '🍽️' : cat === 'drink' ? '🥤' : cat === 'dessert' ? '🍰' : '🎮'
      }));
      response.options.push({ id: 'back', text: '← Back to Main Menu', icon: '🏠' });
      return response;
    }

    // Categories browsing
    if (lowerMessage === 'categories' || userMessage === 'categories') {
      response.text = "Select a category to explore:";
      const categories = [...new Set(products.map(p => p.category))];
      response.options = categories.map(cat => ({
        id: `cat_${cat}`,
        text: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        icon: cat === 'coffee' ? '☕' : cat === 'food' ? '🍽️' : cat === 'drink' ? '🥤' : cat === 'dessert' ? '🍰' : '🎮'
      }));
      return response;
    }

    // Category-specific views
    if (lowerMessage.startsWith('cat_')) {
      const category = lowerMessage.replace('cat_', '');
      const categoryProducts = products.filter(p => p.category === category && p.stock > 0);
      
      if (categoryProducts.length > 0) {
        response.text = `Here are our ${category} items. Click to add to cart:`;
        response.options = categoryProducts.slice(0, 6).map(p => ({
          id: `add_${p.id}`,
          text: `${p.name} - ${p.price.toFixed(2)} TnD`,
          icon: '➕',
          product: p
        }));
        if (categoryProducts.length > 6) {
          response.options.push({ 
            id: 'more', 
            text: `See ${categoryProducts.length - 6} more items...`, 
            icon: '👀' 
          });
        }
        response.options.push({ id: 'categories', text: '← Back to Categories', icon: '🏷️' });
        return response;
      } else {
        response.text = `Sorry, no ${category} items available right now. Try another category?`;
        response.options = [{ id: 'categories', text: 'Browse Categories', icon: '🏷️' }];
        return response;
      }
    }

    // Add to cart action
    if (lowerMessage.startsWith('add_')) {
      const productId = parseInt(lowerMessage.replace('add_', ''));
      const product = products.find(p => p.id === productId);
      if (product) {
        onAddToCart(product);
        response.text = `✅ ${product.name} added to cart! (${product.price.toFixed(2)} TnD)\n\nWhat would you like to do next?`;
        response.options = [
          { id: `cat_${product.category}`, text: `More ${product.category}`, icon: '🔄' },
          { id: 'categories', text: 'Browse Categories', icon: '🏷️' },
          { id: 'checkout', text: 'View Cart & Checkout', icon: '🛒' }
        ];
        return response;
      }
    }

    // Recommendations
    if (lowerMessage.match(/\b(recommend|suggestion|popular|best)\b/) || userMessage === 'recommend' || userMessage === 'popular') {
      const topItems = products
        .filter(p => p.stock > 0)
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
      
      response.text = "Here are some popular items you might enjoy:";
      response.options = topItems.map(p => ({
        id: `add_${p.id}`,
        text: `${p.name} - ${p.price.toFixed(2)} TnD`,
        icon: '⭐',
        product: p
      }));
      response.options.push({ id: 'menu', text: 'See Full Menu', icon: '📋' });
      return response;
    }

    // Order help
    if (lowerMessage.match(/\b(order|checkout|cart|buy)\b/) || userMessage === 'order' || userMessage === 'checkout') {
      response.text = "To place an order:\n\n1️⃣ Browse items and click \n'+ Add'\n2️⃣ Click the 🛒 cart icon (bottom right)\n3️⃣ Review and place your order\n\nNeed help finding something?";
      response.options = [
        { id: 'menu', text: 'Browse Menu', icon: '📋' },
        { id: 'recommend', text: 'Get Recommendations', icon: '⭐' },
        { id: 'categories', text: 'View Categories', icon: '🏷️' }
      ];
      return response;
    }

    // Price queries
    if (lowerMessage.match(/\b(price|cost|how much|expensive|cheap)\b/)) {
      const prices = products.filter(p => p.stock > 0).map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      response.text = `Our items range from ${minPrice.toFixed(2)} TnD to ${maxPrice.toFixed(2)} TnD.`;
      response.options = [
        { id: 'menu', text: 'View Full Menu', icon: '📋' },
        { id: 'recommend', text: 'Get Recommendations', icon: '⭐' }
      ];
      return response;
    }

    // Stock/availability
    if (lowerMessage.match(/\b(available|stock|in stock)\b/)) {
      const inStock = products.filter(p => p.stock > 0).length;
      const outOfStock = products.filter(p => !p.stock).length;
      response.text = `We have ${inStock} items available right now! ${outOfStock > 0 ? `${outOfStock} items are temporarily out of stock.` : ''}`;
      response.options = [
        { id: 'menu', text: 'Browse Available Items', icon: '📋' },
        { id: 'categories', text: 'View by Category', icon: '🏷️' }
      ];
      return response;
    }

    // Thank you
    if (lowerMessage.match(/\b(thank|thanks)\b/)) {
      response.text = "You're welcome! 😊 Anything else I can help with?";
      response.options = [
        { id: 'menu', text: 'Browse Menu', icon: '📋' },
        { id: 'recommend', text: 'Recommendations', icon: '⭐' }
      ];
      return response;
    }

    // Goodbye
    if (lowerMessage.match(/\b(bye|goodbye)\b/)) {
      response.text = "Enjoy your meal ! 👋 Feel free to chat anytime!";
      return response;
    }

    // Back to main
    if (userMessage === 'back') {
      response.text = "What can I help you with?";
      response.options = [
        { id: 'menu', text: '📋 Browse Menu', icon: '📋' },
        { id: 'recommend', text: '⭐ Recommendations', icon: '⭐' },
        { id: 'popular', text: '🔥 Popular Items', icon: '🔥' },
        { id: 'order', text: '🛒 How to Order', icon: '🛒' }
      ];
      return response;
    }

    // Default response
    response.text = "I can help you with:\n\n• Browse our menu\n• Get recommendations\n• Add items to cart\n• Learn how to order\n\nWhat interests you?";
    response.options = [
      { id: 'menu', text: 'Browse Menu', icon: '📋' },
      { id: 'recommend', text: 'Recommendations', icon: '⭐' },
      { id: 'order', text: 'How to Order', icon: '🛒' }
    ];
    
    return response;
  };

  const handleOptionClick = (optionId) => {
    // Add user's choice as a message
    const option = messages[messages.length - 1].options?.find(opt => opt.id === optionId);
    if (option) {
      const userMessage = {
        id: Date.now().toString(),
        text: option.text,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
    }

    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateBotResponse(optionId, true);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        options: botResponse.options
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        options: botResponse.options
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  return (
    <>
      {/* Fullscreen Welcome Animation */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="text-center">
              {/* Waiter Avatar with Glow Effect */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  duration: 0.8 
                }}
                className="mx-auto mb-8 relative"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 40px rgba(168, 85, 247, 0.6)",
                      "0 0 80px rgba(236, 72, 153, 0.9)",
                      "0 0 40px rgba(168, 85, 247, 0.6)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-40 h-40 sm:w-52 sm:h-52 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30"
                >
                  <Bot size={80} className="sm:w-28 sm:h-28 text-white" />
                </motion.div>

                {/* Sparkles around avatar */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles className="absolute -top-4 left-1/2 w-8 h-8 text-yellow-300" />
                  <Sparkles className="absolute top-1/2 -right-4 w-7 h-7 text-pink-300" />
                  <Sparkles className="absolute -bottom-4 left-1/4 w-6 h-6 text-purple-300" />
                  <Sparkles className="absolute top-1/4 -left-4 w-7 h-7 text-cyan-300" />
                </motion.div>
              </motion.div>

              {/* Welcome Text */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-4"
              >
                <motion.h1
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-4xl sm:text-6xl font-bold text-white"
                >
                  Hi! I'm Alex 👋
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="text-xl sm:text-2xl text-purple-200 font-medium"
                >
                  Your AI Waiter
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="text-lg sm:text-xl text-white/80 max-w-md mx-auto"
                >
                  Ready to help you browse our menu and place orders! 🎉
                </motion.p>

                {/* Animated dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="flex gap-2 mt-8 justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className="w-3 h-3 bg-purple-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-3 h-3 bg-pink-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-3 h-3 bg-purple-400 rounded-full"
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-44 sm:bottom-48 right-6 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center z-50 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={hasNewMessage ? { 
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 20px 25px -5px rgba(168, 85, 247, 0.4)",
            "0 20px 25px -5px rgba(236, 72, 153, 0.6)",
            "0 20px 25px -5px rgba(168, 85, 247, 0.4)"
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: hasNewMessage ? Infinity : 0 }}
      >
        <div className="relative">
          {isOpen ? (
            <X size={24} className="sm:w-7 sm:h-7" />
          ) : (
            <>
              <MessageCircle size={24} className="sm:w-7 sm:h-7" />
              {hasNewMessage && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                >
                  !
                </motion.span>
              )}
            </>
          )}
        </div>
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-64 sm:bottom-72 sm:right-8 sm:left-auto top-4 sm:top-auto sm:w-96 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">Alex - AI Waiter</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-xs">Online & Ready</span>
                </div>
              </div>
            </div>

            {/* Messages */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 chat-messages-container">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User size={18} className="text-white" />
                      ) : (
                        <Bot size={18} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`rounded-2xl p-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                      </div>
                      
                      {/* Interactive Options */}
                      {message.sender === 'bot' && message.options && message.options.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.options.map((option) => (
                            <motion.button
                              key={option.id}
                              onClick={() => handleOptionClick(option.id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-slate-600/80 hover:bg-slate-600 text-white text-sm py-2.5 px-3 rounded-xl flex items-center gap-2 transition-all border border-slate-500/30 hover:border-purple-500/50"
                            >
                              <span className="text-base">{option.icon}</span>
                              <span className="flex-1 text-left">{option.text}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500 mt-1 px-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-2 items-end">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className="bg-slate-700 rounded-2xl p-3">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-slate-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-slate-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-slate-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-800/80 border-t border-slate-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-slate-900/50 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}