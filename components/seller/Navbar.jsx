import React from 'react'
import { assets } from '../../assets/assets'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'
import { IoChevronBack } from "react-icons/io5"; // Import the back icon

const Navbar = () => {

  const { router } = useAppContext()

  return (
    <div className='flex items-center px-4 md:px-8 pb-4 justify-between border-b'>
      {/* Group the back button and logo together */}
      <div className='flex items-center gap-2 sm:gap-4'>
        <Image 
          onClick={() => router.push('/')} 
          className='w-28 lg:w-32 cursor-pointer' 
          src={assets.logo} 
          alt="Company Logo" 
        />
        <button 
          onClick={() => router.push('/seller')} 
          className='flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors text-md md:text-lg'
          aria-label="Go back to seller dashboard"
        >
          <IoChevronBack size={24} className='text-gray-700' />
          Back
        </button>
      </div>

      {/* POS Button on the right */}
      <button 
        onClick={() => router.push('/seller/pos')} 
        className='bg-black text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'
      >
        POS
      </button>
    </div>
  )
}

export default Navbar
