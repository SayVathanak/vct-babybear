// // components/TelegramChat.jsx
// "use client"; // For Next.js App Router, marks it as a Client Component

// import React from 'react';

// // Optional: If you want to use react-icons for the icon
// // import { FaTelegramPlane } from 'react-icons/fa';

// const TelegramChat = () => {
//   // --- IMPORTANT: Replace this with your actual Telegram link ---
//   const telegramLink = 'https://t.me/BabyBearVCT';
//   // For example:
//   // const telegramLink = 'https://t.me/BabyBearSupport'; // If you have a username like BabyBearSupport
//   // const telegramLink = 'https://t.me/joinchat/ABC123XYZ'; // If it's a group invite link

//   // Optional: Pre-fill a message
//   // const message = "Hello! I have a question about Baby Bear products.";
//   // const telegramLinkWithMessage = `${telegramLink}?text=${encodeURIComponent(message)}`;

//   return (
//     <a
//       href={telegramLink} // Use telegramLinkWithMessage if you want a pre-filled message
//       target="_blank"
//       rel="noopener noreferrer"
//       title="Chat with us on Telegram"
//       style={{
//         position: 'fixed',
//         bottom: '110px',
//         right: '25px',
//         backgroundColor: '#0088cc', // Telegram blue
//         color: 'white',
//         width: '50px',
//         height: '50px',
//         borderRadius: '50%',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
//         zIndex: 1050, // Ensure it's above other fixed elements
//         cursor: 'pointer',
//         textDecoration: 'none',
//         transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
//       }}
//       onMouseOver={(e) => {
//         e.currentTarget.style.transform = 'scale(1.1)';
//         e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
//       }}
//       onMouseOut={(e) => {
//         e.currentTarget.style.transform = 'scale(1)';
//         e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
//       }}
//     >
//       {/* Simple SVG Telegram Icon */}
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="24"
//         height="24"
//         viewBox="0 0 24 24"
//         fill="currentColor"
//         aria-hidden="true"
//       >
//         <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 11.9c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.58c-.28 1.13-.96 1.36-1.88.83l-4.92-3.6-2.38 2.31c-.26.26-.6.39-.91.39z"/>
//       </svg>
//       {/*
//         If using react-icons:
//         1. npm install react-icons
//         2. Uncomment the import: import { FaTelegramPlane } from 'react-icons/fa';
//         3. Use it here: <FaTelegramPlane size={24} />
//       */}
//     </a>
//   );
// };

// export default TelegramChat;

// components/TelegramChat.jsx
"use client"; // For Next.js App Router, marks it as a Client Component

import React from 'react';

// --- IMPORT THE DESIRED ICON ---
import { CiChat1 } from "react-icons/ci";

// Optional: If you want to use react-icons for the icon
// import { FaTelegramPlane } from 'react-icons/fa'; // You can remove this if not used elsewhere

const TelegramChat = () => {
  // --- IMPORTANT: Replace this with your actual Telegram link ---
  const telegramLink = 'https://t.me/BabyBearVCT';
  // For example:
  // const telegramLink = 'https://t.me/BabyBearSupport'; // If you have a username like BabyBearSupport
  // const telegramLink = 'https://t.me/joinchat/ABC123XYZ'; // If it's a group invite link

  // Optional: Pre-fill a message
  // const message = "Hello! I have a question about Baby Bear products.";
  // const telegramLinkWithMessage = `${telegramLink}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={telegramLink} // Use telegramLinkWithMessage if you want a pre-filled message
      target="_blank"
      rel="noopener noreferrer"
      title="Chat with us on Telegram"
      style={{
        position: 'fixed',
        bottom: '110px',
        right: '25px',
        backgroundColor: '#A1E3F9', // Telegram blue
        color: 'white',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 40, // Ensure it's above other fixed elements
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
      }}
    >
      {/* --- USE THE CiChat1 ICON HERE --- */}
      <CiChat1 size={24} /> {/* You can adjust the size as needed */}

      {/*
        The previous SVG icon has been replaced.
        If you were using react-icons previously with FaTelegramPlane:
        1. Ensure you have react-icons installed: npm install react-icons or yarn add react-icons
        2. The import for CiChat1 is now at the top.
      */}
    </a>
  );
};

export default TelegramChat;