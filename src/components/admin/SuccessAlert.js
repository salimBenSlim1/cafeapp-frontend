import React, { useEffect, useState } from "react";

export default function SuccessMessage({ setShowSuccess }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Start exit animation after 2.5 seconds
    const exitTimer = setTimeout(() => setIsLeaving(true), 2500);
    
    // Hide completely after animation finishes
    const hideTimer = setTimeout(() => setShowSuccess(false), 3000);
    
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [setShowSuccess]);

  return (
    <div
      className={`success-message ${isLeaving ? 'leaving' : ''}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        margin: "8px",
        background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)",
        border: "1px solid #4caf50",
        color: "#2e7d32",
        fontWeight: 600,
        padding: "14px 20px",
        borderRadius: "16px",
        width: "fit-content",
        boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2), 0 0 0 1px rgba(76, 175, 80, 0.1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated gradient background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
          animation: "shimmer 1.5s ease-in-out",
        }}
      />

      {/* Success Icon with animation */}
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4caf50, #66bb6a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
          animation: "scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ animation: "drawCheck 0.5s ease-out 0.2s both" }}
        >
          <path
            d="M3 8L6.5 11.5L13 4.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Success Text */}
      <span style={{ fontSize: "15px", letterSpacing: "0.2px", position: "relative", zIndex: 1 }}>
        Item updated successfully
      </span>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          background: "linear-gradient(90deg, #4caf50, #66bb6a)",
          animation: "progress 3s linear forwards",
          borderRadius: "0 0 0 16px",
        }}
      />

      <style>
        {`
          @keyframes fadeIn {
            from { 
              opacity: 0; 
              transform: translateY(-10px) scale(0.95);
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1);
            }
          }

          @keyframes fadeOut {
            from { 
              opacity: 1; 
              transform: translateY(0) scale(1);
            }
            to { 
              opacity: 0; 
              transform: translateY(-10px) scale(0.95);
            }
          }

          @keyframes scaleIn {
            from {
              transform: scale(0) rotate(-180deg);
            }
            to {
              transform: scale(1) rotate(0deg);
            }
          }

          @keyframes drawCheck {
            from {
              stroke-dasharray: 20;
              stroke-dashoffset: 20;
            }
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes shimmer {
            to {
              left: 100%;
            }
          }

          @keyframes progress {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }

          .success-message {
            animation: fadeIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .success-message.leaving {
            animation: fadeOut 0.5s cubic-bezier(0.6, 0.04, 0.98, 0.335) forwards;
          }
        `}
      </style>
    </div>
  );
}
